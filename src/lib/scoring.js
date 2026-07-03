window.BearScoring = (() => {
  function strokesOnHole(handicap, strokeIndex) {
    if (!handicap || handicap <= 0) return 0;
    const base = Math.floor(handicap / 18);
    const extra = handicap % 18;
    return base + (strokeIndex <= extra ? 1 : 0);
  }
  function stableford(gross, par, strokes) {
    if (!gross) return 0;
    const net = gross - strokes;
    const diff = net - par;
    if (diff <= -3) return 8;
    if (diff === -2) return 6;
    if (diff === -1) return 4;
    if (diff === 0) return 2;
    if (diff === 1) return 1;
    return 0;
  }
  function summarizePlayer(player, scores, course) {
    let gross = 0, net = 0, points = 0, thru = 0;
    course.holes.forEach(h => {
      const g = scores[player.id]?.[h.hole];
      if (g) {
        const strokes = strokesOnHole(player.handicap, h.strokeIndex);
        gross += g; net += g - strokes; points += stableford(g, h.par, strokes); thru += 1;
      }
    });
    return { player, gross, net, points, thru, plusMinus: points - player.quota };
  }
  function leaderboard(players, scores, course) {
    return players.map(p => summarizePlayer(p, scores, course))
      .sort((a,b) => b.plusMinus - a.plusMinus || b.points - a.points || a.player.name.localeCompare(b.player.name));
  }
  function netSkins(players, scores, course) {
    return course.holes.map(h => {
      const entries = players.map(p => {
        const gross = scores[p.id]?.[h.hole];
        if (!gross) return null;
        const strokes = strokesOnHole(p.handicap, h.strokeIndex);
        return { player:p, gross, net:gross - strokes };
      }).filter(Boolean);
      if (!entries.length) return { hole:h.hole, status:'pending' };
      const low = Math.min(...entries.map(e => e.net));
      const lows = entries.filter(e => e.net === low);
      if (lows.length === 1) return { hole:h.hole, winner:lows[0].player.name, net:low, gross:lows[0].gross };
      return { hole:h.hole, status:'no skin', tied:lows.map(e=>e.player.name), net:low };
    });
  }
  function quotaChange(result, paidPlaceWinner) {
    const pm = result.plusMinus;
    if (pm > 0 && !paidPlaceWinner) return 0;
    if (pm <= -10) return -4;
    if (pm <= -6) return -3;
    if (pm <= -3) return -2;
    if (pm <= -1) return -1;
    if (pm === 0) return 0;
    if (pm <= 2) return 1;
    if (pm <= 4) return 2;
    if (pm <= 6) return 3;
    if (pm <= 9) return 4;
    return Math.ceil(pm / 2);
  }
  return { strokesOnHole, stableford, summarizePlayer, leaderboard, netSkins, quotaChange };
})();
