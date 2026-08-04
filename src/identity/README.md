# Player Identity Subsystem

## Responsibility

Convert text referring to a golfer into the correct permanent LeaguePlayer.

## Owns

- Player-name normalization
- Player aliases
- Nickname knowledge
- Identity matching
- Match confidence
- Alias suggestions and learning

## Does Not Own

- OCR image or text recognition
- Tournament handicaps or quotas
- Score entry
- Stableford calculations
- Pairings workflow

## Planned Public API

- `generateSuggestedAliases(player, roster)`
- `normalizePlayerName(text)`
- `findPlayerByName(text, roster)`
- `findBestPlayerMatch(text, roster)`
- `learnAlias(player, alias)`