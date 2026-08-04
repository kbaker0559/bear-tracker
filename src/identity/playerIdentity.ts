import type {
  LeaguePlayer,
  PlayerAlias,
} from '../types/leaguePlayer';
const IDENTITY_CONFIDENCE = {
  canonicalName: 100,
  savedAlias: 100,
  generatedAlias: 90,
  fuzzyOneEdit: 80,
  fuzzyTwoEdits: 65,
  ambiguousFirstName: 50,
} as const;

export type IdentityEvidence = {
  type:
    | 'canonical-name'
    | 'saved-alias'
    | 'generated-alias'
    | 'first-name'
    | 'fuzzy-name'
    | 'nickname'
    | 'ocr'
    | 'manual';

  description: string;
  points: number;
};

export type PlayerIdentityMatch = {
  player: LeaguePlayer;
  matchedValue: string;
  matchedBy:
    | 'canonical-name'
    | 'saved-alias'
    | 'generated-alias'
    | 'first-name'
    | 'fuzzy-name';

  confidence: number;
  evidence: IdentityEvidence[];
};

type IdentityCandidate = {
  value: string;
  source:
    | 'canonical-name'
    | 'saved-alias'
    | 'generated-alias';
  sourceWeight: number;
};

function calculateConfidence(
  evidence: IdentityEvidence[]
): number {
  return Math.min(
    100,
    evidence.reduce(
      (total, item) => total + item.points,
      0
    )
  );
}

function addSuggestion(
  suggestions: PlayerAlias[],
  value: string
) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return;
  }

  const alreadyExists = suggestions.some(
    (alias) =>
      normalizePlayerName(alias.value) ===
      normalizePlayerName(trimmedValue)
  );

  if (alreadyExists) {
    return;
  }

  suggestions.push({
    value: trimmedValue,
    source: 'generated',
  });
}

function isUniqueInRoster(
  roster: LeaguePlayer[],
  player: LeaguePlayer,
  value: string,
  selector: (player: LeaguePlayer) => string
) {
  return !roster.some(
    (leaguePlayer) =>
      leaguePlayer.id !== player.id &&
      normalizePlayerName(
        selector(leaguePlayer)
      ) === normalizePlayerName(value)
  );
}

function editDistance(
  firstValue: string,
  secondValue: string
): number {
  const first = normalizePlayerName(firstValue);
  const second = normalizePlayerName(secondValue);

  const rows = first.length + 1;
  const columns = second.length + 1;

  const matrix = Array.from(
    { length: rows },
    () => Array<number>(columns).fill(0)
  );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (
    let column = 0;
    column < columns;
    column += 1
  ) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (
      let column = 1;
      column < columns;
      column += 1
    ) {
      const substitutionCost =
        first[row - 1] === second[column - 1]
          ? 0
          : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] +
          substitutionCost
      );
    }
  }

  return matrix[first.length][second.length];
}

function buildIdentityCandidates(
  player: LeaguePlayer,
  roster: LeaguePlayer[]
): IdentityCandidate[] {
  const canonicalName =
    `${player.firstName} ${player.lastName}`.trim();

  const candidates: IdentityCandidate[] = [
  {
    value: canonicalName,
    source: 'canonical-name',
    sourceWeight: 100,
  },
  ...player.aliases.map((alias) => ({
    value: alias.value,
    source: 'saved-alias' as const,
    sourceWeight: 95,
  })),
  ...generatePlayerIdentity(
    player,
    roster
  ).map((alias) => ({
    value: alias.value,
    source: 'generated-alias' as const,
    sourceWeight: 90,
  })),
];

  const uniqueCandidates =
    new Map<string, IdentityCandidate>();

  for (const candidate of candidates) {
    const normalized =
      normalizePlayerName(candidate.value);

    if (
      normalized.length > 0 &&
      !uniqueCandidates.has(normalized)
    ) {
      uniqueCandidates.set(
        normalized,
        candidate
      );
    }
  }

  return [...uniqueCandidates.values()];
}

export function normalizePlayerName(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/\bjunior\b/g, 'jr')
    .replace(/\bsenior\b/g, 'sr')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function generatePlayerIdentity(
  player: LeaguePlayer,
  roster: LeaguePlayer[]
): PlayerAlias[] {
  const suggestions: PlayerAlias[] = [];

  const firstName = player.firstName.trim();
  const rawLastName = player.lastName.trim();

  const suffixMatch = rawLastName.match(
    /\s+(JR|SR|Jr\.?|Sr\.?)$/i
  );

  const suffix = suffixMatch
    ? suffixMatch[1]
        .replace('.', '')
        .toUpperCase()
    : '';

  const lastName = suffixMatch
    ? rawLastName
        .slice(0, suffixMatch.index)
        .trim()
    : rawLastName;

  if (
    firstName.length > 0 &&
    isUniqueInRoster(
      roster,
      player,
      firstName,
      (leaguePlayer) =>
        leaguePlayer.firstName
    )
  ) {
    addSuggestion(
      suggestions,
      firstName
    );
  }

  if (
    lastName.length > 0 &&
    isUniqueInRoster(
      roster,
      player,
      lastName,
      (leaguePlayer) =>
        leaguePlayer.lastName.replace(
          /\s+(JR|SR|Jr\.?|Sr\.?)$/i,
          ''
        )
    )
  ) {
    addSuggestion(
      suggestions,
      lastName
    );
  }

  if (
    firstName.length > 0 &&
    lastName.length > 0
  ) {
    addSuggestion(
      suggestions,
      `${firstName.charAt(0)}. ${lastName}`
    );

    addSuggestion(
      suggestions,
      `${firstName} ${lastName.charAt(0)}.`
    );

    addSuggestion(
      suggestions,
      `${firstName} ${lastName}`
    );

    addSuggestion(
      suggestions,
      `${lastName}, ${firstName}`
    );
  }

  if (
    firstName.length > 0 &&
    suffix.length > 0
  ) {
    const displaySuffix =
      suffix === 'JR' ? 'Jr.' : 'Sr.';

    addSuggestion(
      suggestions,
      `${firstName} ${displaySuffix}`
    );

    addSuggestion(
      suggestions,
      `${firstName} ${suffix}`
    );

    if (lastName.length > 0) {
      addSuggestion(
        suggestions,
        `${firstName} ${lastName} ${displaySuffix}`
      );

      addSuggestion(
        suggestions,
        `${firstName.charAt(0)}. ${lastName} ${displaySuffix}`
      );
    }
  }

  return suggestions;
}

export function findPlayerIdentityMatches(
  input: string,
  roster: LeaguePlayer[]
): PlayerIdentityMatch[] {
  const normalizedInput =
    normalizePlayerName(input);

  if (normalizedInput.length === 0) {
    return [];
  }

  const matches: PlayerIdentityMatch[] = [];

  for (const player of roster) {
    const canonicalName =
      `${player.firstName} ${player.lastName}`.trim();

    if (
      normalizePlayerName(canonicalName) ===
      normalizedInput
    ) {
      const evidence: IdentityEvidence[] = [
        {
          type: 'canonical-name',
          description:
            `Canonical name: "${canonicalName}"`,
          points: IDENTITY_CONFIDENCE.canonicalName,
        },
      ];

      matches.push({
        player,
        matchedValue: canonicalName,
        matchedBy: 'canonical-name',
        evidence,
        confidence:
          calculateConfidence(evidence),
      });

      continue;
    }

    const savedAlias = player.aliases.find(
      (alias) =>
        normalizePlayerName(alias.value) ===
        normalizedInput
    );

    if (savedAlias) {
      const evidence: IdentityEvidence[] = [
        {
          type: 'saved-alias',
          description:
            `Saved alias: "${savedAlias.value}"`,
          points: IDENTITY_CONFIDENCE.savedAlias,
        },
      ];

      matches.push({
        player,
        matchedValue: savedAlias.value,
        matchedBy: 'saved-alias',
        evidence,
        confidence:
          calculateConfidence(evidence),
      });

      continue;
    }

    const generatedAlias =
      generatePlayerIdentity(
        player,
        roster
      ).find(
        (alias) =>
          normalizePlayerName(alias.value) ===
          normalizedInput
      );

    if (generatedAlias) {
      const evidence: IdentityEvidence[] = [
        {
          type: 'generated-alias',
          description:
            `Generated alias: "${generatedAlias.value}"`,
          points: IDENTITY_CONFIDENCE.generatedAlias,
        },
      ];

      matches.push({
        player,
        matchedValue:
          generatedAlias.value,
        matchedBy: 'generated-alias',
        evidence,
        confidence:
          calculateConfidence(evidence),
      });
    }
  }

  if (matches.length === 0) {
    const firstNameMatches = roster.filter(
      (player) =>
        normalizePlayerName(
          player.firstName
        ) === normalizedInput
    );

    if (firstNameMatches.length > 1) {
      for (const player of firstNameMatches) {
        const evidence: IdentityEvidence[] = [
  {
    type: 'first-name',
    description: `Ambiguous first name: "${player.firstName}"`,
    points: IDENTITY_CONFIDENCE.ambiguousFirstName,
  },
];

        matches.push({
          player,
          matchedValue:
            player.firstName,
          matchedBy: 'first-name',
          evidence,
          confidence:
            calculateConfidence(evidence),
        });
      }
    }
  }

  if (matches.length === 0) {
    const fuzzyMatches =
      roster.flatMap((player) => {
        const candidates =
          buildIdentityCandidates(
            player,
            roster
          );

        const closestCandidate =
          candidates
            .map((candidate) => {
              const distance =
                editDistance(
                  normalizedInput,
                  candidate.value
                );

              const candidateLength =
                normalizePlayerName(
                  candidate.value
                ).length;

              const longestLength =
                Math.max(
                  normalizedInput.length,
                  candidateLength
                );

              const similarity =
                longestLength === 0
                  ? 0
                  : 1 -
                    distance /
                      longestLength;

              return {
                candidate,
                distance,
                similarity,
              };
            })
            .sort(
  (a, b) =>
    a.distance - b.distance ||
    b.similarity - a.similarity ||
    b.candidate.sourceWeight -
      a.candidate.sourceWeight
)[0];

        if (!closestCandidate) {
          return [];
        }

        const maximumDistance =
          normalizedInput.length <= 5
            ? 1
            : 2;

        if (
          closestCandidate.distance >
            maximumDistance ||
          closestCandidate.similarity < 0.72
        ) {
          return [];
        }

        const points =
  closestCandidate.distance === 1
    ? IDENTITY_CONFIDENCE.fuzzyOneEdit
    : IDENTITY_CONFIDENCE.fuzzyTwoEdits;

        const evidence: IdentityEvidence[] = [
          {
            type: 'fuzzy-name',
            description:
              `Near match to "${closestCandidate.candidate.value}" ` +
              `with ${closestCandidate.distance} character ` +
              `${closestCandidate.distance === 1 ? 'difference' : 'differences'}`,
            points,
          },
        ];

        return [
          {
            player,
            matchedValue:
              closestCandidate.candidate.value,
            matchedBy:
              'fuzzy-name' as const,
            evidence,
            confidence:
              calculateConfidence(evidence),
          },
        ];
      })
      .sort(
        (a, b) =>
          b.confidence - a.confidence ||
          a.player.lastName.localeCompare(
            b.player.lastName
          ) ||
          a.player.firstName.localeCompare(
            b.player.firstName
          )
      );

    matches.push(
      ...fuzzyMatches.slice(0, 3)
    );
  }

  return matches.sort(
    (a, b) =>
      b.confidence - a.confidence ||
      a.player.lastName.localeCompare(
        b.player.lastName
      ) ||
      a.player.firstName.localeCompare(
        b.player.firstName
      )
  );
}