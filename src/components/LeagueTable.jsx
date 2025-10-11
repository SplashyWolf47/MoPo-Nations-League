import React from 'react';

const LeagueTable = ({ teams, players, showPlayers = true }) => {
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const calculateGoalDifference = (team) => {
    return team.goalsFor - team.goalsAgainst;
  };

  const calculateWinRate = (team) => {
    if (team.played === 0) return 0;
    return team.won / team.played;
  };

  const calculateDrawRate = (team) => {
    if (team.played === 0) return 0;
    return team.drawn / team.played;
  };

  const getSortedTeams = () => {
    return [...teams].sort((a, b) => {
      const winsDiff = b.won - a.won;
      if (winsDiff !== 0) return winsDiff;
      
      const winRateDiff = calculateWinRate(b) - calculateWinRate(a);
      if (Math.abs(winRateDiff) > 0.0001) return winRateDiff;
      
      const drawsDiff = b.drawn - a.drawn;
      if (drawsDiff !== 0) return drawsDiff;
      
      const drawRateDiff = calculateDrawRate(b) - calculateDrawRate(a);
      if (Math.abs(drawRateDiff) > 0.0001) return drawRateDiff;
      
      const gdDiff = calculateGoalDifference(b) - calculateGoalDifference(a);
      if (gdDiff !== 0) return gdDiff;
      
      return b.goalsFor - a.goalsFor;
    });
  };

  const sortedTeams = getSortedTeams();

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <h2 className="text-2xl font-bold">League Table</h2>
        </div>
        <div className="p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No teams yet</p>
          <p className="text-gray-400">Add your first match result to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-green-600 text-white p-4">
        <h2 className="text-2xl font-bold">League Table</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pos</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Team</th>
              {showPlayers && (
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Players</th>
              )}
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">P</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">W</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">W%</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">D</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">D%</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">L</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">GF</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">GA</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">GD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTeams.map((team, index) => {
              const gd = calculateGoalDifference(team);
              const winRate = calculateWinRate(team);
              const drawRate = calculateDrawRate(team);
              const positionColor = team.played >= 8 ? 'bg-green-50' : '';

              return (
                <tr key={team.id} className={positionColor + ' hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{team.name}</td>
                  {showPlayers && (
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {team.playerIds && team.playerIds.length > 0
                        ? team.playerIds.map(id => getPlayerName(id)).join(', ')
                        : 'No players assigned'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-gray-700">{team.played}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{team.won}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {team.played > 0 ? (winRate * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{team.drawn}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {team.played > 0 ? (drawRate * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{team.lost}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{team.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{team.goalsAgainst}</td>
                  <td className={'px-4 py-3 text-center font-semibold ' + (gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-600' : 'text-gray-700')}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 text-xs text-gray-600">
        <p className="mb-2"><strong>Key:</strong></p>
        <div className="flex gap-4 flex-wrap">
          <span>P = Played</span>
          <span>W = Won</span>
          <span>W% = Win Rate</span>
          <span>D = Drawn</span>
          <span>D% = Draw Rate</span>
          <span>L = Lost</span>
          <span>GF = Goals For</span>
          <span>GA = Goals Against</span>
          <span>GD = Goal Difference</span>
        </div>
        <p className="mt-2 text-gray-500 italic">
          Teams ranked by: Wins → Win Rate → Draws → Draw Rate → Goal Difference → Goals For
        </p>
        <p className="mt-2 text-green-600 font-semibold">
          🟢 Green highlight = Teams with 8+ matches played
        </p>
      </div>
    </div>
  );
};

export default LeagueTable;
