import React, { useState, useEffect } from 'react';

const PublicView = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
    const interval = setInterval(loadTeams, 3600000); // Refresh every 60 minutes (3600000 milliseconds)
    return () => clearInterval(interval);
  }, []);

  const loadTeams = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/teams?select=*&order=id.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to load teams');

      const data = await response.json();
      setTeams(data.map(team => ({
        id: team.id,
        name: team.name,
        played: team.played || 0,
        won: team.won || 0,
        drawn: team.drawn || 0,
        lost: team.lost || 0,
        goalsFor: team.goals_for || 0,
        goalsAgainst: team.goals_against || 0
      })));
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading league standings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Football League Standings</h1>
          <p className="text-gray-600 text-lg">Live league table</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
            <h2 className="text-3xl font-bold">League Table</h2>
          </div>
          
          {teams.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-500 text-xl mb-2">No teams yet</p>
              <p className="text-gray-400">The season will begin soon!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pos</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">P</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">W</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">W%</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">D</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">D%</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">L</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">GF</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">GA</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">GD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTeams.map((team, index) => {
                      const gd = calculateGoalDifference(team);
                      const winRate = calculateWinRate(team);
                      const drawRate = calculateDrawRate(team);
                      let positionColor = '';
                      if (team.played >= 8) {
                        positionColor = 'bg-green-50';
                      }

                      return (
                        <tr key={team.id} className={`${positionColor} hover:bg-gray-50 transition-colors`}>
                          <td className="px-6 py-4 text-center font-bold text-lg text-gray-700">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-lg text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 text-center text-gray-700">{team.played}</td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-700">{team.won}</td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {team.played > 0 ? (winRate * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">{team.drawn}</td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {team.played > 0 ? (drawRate * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">{team.lost}</td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-700">{team.goalsFor}</td>
                          <td className="px-6 py-4 text-center text-gray-700">{team.goalsAgainst}</td>
                          <td className={`px-6 py-4 text-center font-bold text-lg ${gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {gd > 0 ? '+' : ''}{gd}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-6 text-sm text-gray-600 border-t border-gray-200">
                <p className="mb-3 font-semibold text-gray-700">Key:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                <p className="mt-4 text-gray-500 italic">
                  Teams ranked by: Wins → Win Rate → Draws → Draw Rate → Goal Difference → Goals For
                </p>
                <p className="mt-2 text-green-600 font-semibold">
                  🟢 Green highlight = Teams with 8+ matches played
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicView;
