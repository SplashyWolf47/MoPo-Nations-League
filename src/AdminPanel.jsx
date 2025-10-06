import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

  // CHANGE THIS PASSWORD TO YOUR OWN!
  const ADMIN_PASSWORD = 'leagueadmin2025';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [matchHistory, setMatchHistory] = useState([]);
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [homeTeamMode, setHomeTeamMode] = useState('existing');
  const [awayTeamMode, setAwayTeamMode] = useState('existing');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadTeams();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      loadTeams();
    } else {
      alert('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPasswordInput('');
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
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

  const addMatchResult = async () => {
    let finalHomeTeam = '';
    let finalAwayTeam = '';

    if (homeTeamMode === 'new') {
      if (!newHomeTeam.trim()) {
        alert('Please enter a home team name');
        return;
      }
      finalHomeTeam = newHomeTeam.trim();
    } else {
      if (!homeTeam) {
        alert('Please select a home team');
        return;
      }
      finalHomeTeam = homeTeam;
    }

    if (awayTeamMode === 'new') {
      if (!newAwayTeam.trim()) {
        alert('Please enter an away team name');
        return;
      }
      finalAwayTeam = newAwayTeam.trim();
    } else {
      if (!awayTeam) {
        alert('Please select an away team');
        return;
      }
      finalAwayTeam = awayTeam;
    }

    if (homeScore === '' || awayScore === '') {
      alert('Please enter both scores');
      return;
    }

    if (finalHomeTeam.toLowerCase() === finalAwayTeam.toLowerCase()) {
      alert('Home and away teams must be different');
      return;
    }

    const homeGoals = parseInt(homeScore);
    const awayGoals = parseInt(awayScore);

    try {
      setSaving(true);

      let homeTeamData = teams.find(t => t.name === finalHomeTeam);
      
      if (!homeTeamData) {
        const response = await fetch(`${supabaseUrl}/rest/v1/teams`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: finalHomeTeam,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goals_for: 0,
            goals_against: 0
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Failed to create home team: ' + errorText);
        }
        
        const data = await response.json();
        homeTeamData = {
          id: data[0].id,
          name: data[0].name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0
        };
      }

      let awayTeamData = teams.find(t => t.name === finalAwayTeam);
      
      if (!awayTeamData) {
        const response = await fetch(`${supabaseUrl}/rest/v1/teams`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: finalAwayTeam,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goals_for: 0,
            goals_against: 0
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Failed to create away team: ' + errorText);
        }
        
        const data = await response.json();
        awayTeamData = {
          id: data[0].id,
          name: data[0].name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0
        };
      }

      const homeIsWin = homeGoals > awayGoals;
      const homeIsDraw = homeGoals === awayGoals;
      const homeResponse = await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${homeTeamData.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          played: homeTeamData.played + 1,
          won: homeTeamData.won + (homeIsWin ? 1 : 0),
          drawn: homeTeamData.drawn + (homeIsDraw ? 1 : 0),
          lost: homeTeamData.lost + (!homeIsWin && !homeIsDraw ? 1 : 0),
          goals_for: homeTeamData.goalsFor + homeGoals,
          goals_against: homeTeamData.goalsAgainst + awayGoals
        })
      });

      if (!homeResponse.ok) throw new Error('Failed to update home team');

      const awayIsWin = awayGoals > homeGoals;
      const awayIsDraw = homeGoals === awayGoals;
      const awayResponse = await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${awayTeamData.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          played: awayTeamData.played + 1,
          won: awayTeamData.won + (awayIsWin ? 1 : 0),
          drawn: awayTeamData.drawn + (awayIsDraw ? 1 : 0),
          lost: awayTeamData.lost + (!awayIsWin && !awayIsDraw ? 1 : 0),
          goals_for: awayTeamData.goalsFor + awayGoals,
          goals_against: awayTeamData.goalsAgainst + homeGoals
        })
      });

      if (!awayResponse.ok) throw new Error('Failed to update away team');

      await loadTeams();

      setMatchHistory([
        { homeTeam: finalHomeTeam, awayTeam: finalAwayTeam, homeScore: homeGoals, awayScore: awayGoals, date: new Date() },
        ...matchHistory
      ]);

      setHomeTeam('');
      setAwayTeam('');
      setHomeScore('');
      setAwayScore('');
      setNewHomeTeam('');
      setNewAwayTeam('');
      setHomeTeamMode('existing');
      setAwayTeamMode('existing');

      alert('Match result saved successfully!');
    } catch (error) {
      console.error('Error saving match result:', error);
      alert('Error saving match result. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const resetLeague = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will delete all teams and cannot be undone!')) {
      try {
        setSaving(true);
        const response = await fetch(`${supabaseUrl}/rest/v1/teams?id=neq.0`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!response.ok) throw new Error('Failed to reset league');

        setTeams([]);
        setMatchHistory([]);
        
        alert('League reset successfully!');
      } catch (error) {
        console.error('Error resetting league:', error);
        alert('Error resetting league. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Access</h1>
            <p className="text-gray-600">Enter password to manage the league</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Change the default password in AdminPanel.jsx before production use!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedTeams = getSortedTeams();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
            <button
              onClick={handleLogout}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-600">Manage teams and match results</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Match Result</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Home Team</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setHomeTeamMode('existing')}
                      disabled={saving}
                      className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (homeTeamMode === 'existing' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                    >
                      Existing
                    </button>
                    <button
                      onClick={() => setHomeTeamMode('new')}
                      disabled={saving}
                      className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (homeTeamMode === 'new' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                    >
                      New Team
                    </button>
                  </div>
                  
                  {homeTeamMode === 'existing' ? (
                    <select
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      disabled={teams.length === 0 || saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">
                        {teams.length === 0 ? 'No teams yet - add a new team' : 'Select team...'}
                      </option>
                      {teams.map(team => (
                        <option key={team.id} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newHomeTeam}
                      onChange={(e) => setNewHomeTeam(e.target.value)}
                      placeholder="Enter new team name"
                      disabled={saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Home Score</label>
                    <input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      disabled={saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-center text-xl font-bold disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Away Score</label>
                    <input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      disabled={saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-center text-xl font-bold disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Away Team</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setAwayTeamMode('existing')}
                      disabled={saving}
                      className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (awayTeamMode === 'existing' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                    >
                      Existing
                    </button>
                    <button
                      onClick={() => setAwayTeamMode('new')}
                      disabled={saving}
                      className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (awayTeamMode === 'new' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                    >
                      New Team
                    </button>
                  </div>
                  
                  {awayTeamMode === 'existing' ? (
                    <select
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      disabled={teams.length === 0 || saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">
                        {teams.length === 0 ? 'No teams yet - add a new team' : 'Select team...'}
                      </option>
                      {teams.map(team => (
                        <option key={team.id} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newAwayTeam}
                      onChange={(e) => setNewAwayTeam(e.target.value)}
                      placeholder="Enter new team name"
                      disabled={saving}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
                    />
                  )}
                </div>

                <button
                  onClick={addMatchResult}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Add Result'}
                </button>

                {teams.length > 0 && (
                  <button
                    onClick={resetLeague}
                    disabled={saving}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset League
                  </button>
                )}
              </div>
            </div>

            {matchHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Matches</h3>
                <div className="space-y-2">
                  {matchHistory.slice(0, 5).map((match, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold">{match.homeTeam}</span>
                        <span className="font-bold text-green-600">
                          {match.homeScore} - {match.awayScore}
                        </span>
                        <span className="font-semibold">{match.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h2 className="text-2xl font-bold">League Table</h2>
              </div>
              
              {teams.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg mb-2">No teams yet</p>
                  <p className="text-gray-400">Add your first match result to get started</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pos</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Team</th>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
