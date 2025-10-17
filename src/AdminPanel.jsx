import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MatchEntryForm from './components/MatchEntryForm';
import LeagueTable from './components/LeagueTable';
import PlayerManagement from './components/PlayerManagement';
import CountryManagement from './components/CountryManagement';
import TopScorers from './components/TopScorers';
import { 
  loadTeams, 
  loadPlayers, 
  loadCountries,
  createTeam,
  updateTeam,
  createMatch,
  createMatchGoal,
  createTeamPlayer,
  markCountryAsUsed,
  ADMIN_PASSWORD
} from './utils/supabaseClient';

const AdminPanel = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData, countriesData] = await Promise.all([
        loadTeams(),
        loadPlayers(),
        loadCountries()
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      loadData();
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

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      alert('Please enter a player name');
      return;
    }

    const duplicatePlayer = players.find(
      p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase()
    );
    
    if (duplicatePlayer) {
      alert(`This player already exists: "${duplicatePlayer.name}"`);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/players`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          active: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to add player: ' + errorText);
      }

      const playersData = await loadPlayers();
      setPlayers(playersData);
      setNewPlayerName('');
      alert('Player added successfully!');
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Error adding player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlayerActive = async (playerId, currentStatus) => {
    try {
      setSaving(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${playerId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: !currentStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update player status');

      const playersData = await loadPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to delete ${playerName}? This cannot be undone!`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${playerId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete player');

      const playersData = await loadPlayers();
      setPlayers(playersData);
      alert('Player deleted successfully!');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCountryExcluded = async (countryId, currentExcluded) => {
    try {
      setSaving(true);
      await fetch(`${supabaseUrl}/rest/v1/country_names?id=eq.${countryId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          excluded: !currentExcluded
        })
      });
      
      const countriesData = await loadCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Error updating country:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMatchSaved = async (matchData) => {
    try {
      setSaving(true);

      let homeTeamData = teams.find(t => t.name === matchData.homeTeam);
      
      if (!homeTeamData) {
        const data = await createTeam({
          name: matchData.homeTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          player_ids: matchData.selectedHomePlayers
        });

        homeTeamData = {
          id: data[0].id,
          name: data[0].name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          playerIds: matchData.selectedHomePlayers
        };

        for (const playerId of matchData.selectedHomePlayers) {
          await createTeamPlayer(homeTeamData.id, playerId);
        }

        await markCountryAsUsed(matchData.homeTeam, countries);
      }

      let awayTeamData = teams.find(t => t.name === matchData.awayTeam);
      
      if (!awayTeamData) {
        const data = await createTeam({
          name: matchData.awayTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          player_ids: matchData.selectedAwayPlayers
        });

        awayTeamData = {
          id: data[0].id,
          name: data[0].name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          playerIds: matchData.selectedAwayPlayers
        };

        for (const playerId of matchData.selectedAwayPlayers) {
          await createTeamPlayer(awayTeamData.id, playerId);
        }

        await markCountryAsUsed(matchData.awayTeam, countries);
      }

      const matchRecord = await createMatch({
        home_team_id: homeTeamData.id,
        away_team_id: awayTeamData.id,
        home_score: matchData.homeScore,
        away_score: matchData.awayScore
        round: matchData.round
      });

      const matchId = matchRecord[0].id;

      if (matchData.homeScore > 0 || matchData.awayScore > 0) {
        for (const [playerId, goals] of Object.entries(matchData.homeGoalScorers)) {
          if (goals > 0) {
            await createMatchGoal({
              match_id: matchId,
              team_id: homeTeamData.id,
              player_id: parseInt(playerId),
              goals_scored: goals
            });
          }
        }

        for (const [playerId, goals] of Object.entries(matchData.awayGoalScorers)) {
          if (goals > 0) {
            await createMatchGoal({
              match_id: matchId,
              team_id: awayTeamData.id,
              player_id: parseInt(playerId),
              goals_scored: goals
            });
          }
        }
      }

      const homeIsWin = matchData.homeScore > matchData.awayScore;
      const homeIsDraw = matchData.homeScore === matchData.awayScore;
      await updateTeam(homeTeamData.id, {
        played: homeTeamData.played + 1,
        won: homeTeamData.won + (homeIsWin ? 1 : 0),
        drawn: homeTeamData.drawn + (homeIsDraw ? 1 : 0),
        lost: homeTeamData.lost + (!homeIsWin && !homeIsDraw ? 1 : 0),
        goals_for: homeTeamData.goalsFor + matchData.homeScore,
        goals_against: homeTeamData.goalsAgainst + matchData.awayScore
      });

      const awayIsWin = matchData.awayScore > matchData.homeScore;
      const awayIsDraw = matchData.homeScore === matchData.awayScore;
      await updateTeam(awayTeamData.id, {
        played: awayTeamData.played + 1,
        won: awayTeamData.won + (awayIsWin ? 1 : 0),
        drawn: awayTeamData.drawn + (awayIsDraw ? 1 : 0),
        lost: awayTeamData.lost + (!awayIsWin && !awayIsDraw ? 1 : 0),
        goals_for: awayTeamData.goalsFor + matchData.awayScore,
        goals_against: awayTeamData.goalsAgainst + matchData.homeScore
      });

      await loadData();

      setMatchHistory([
        { 
          homeTeam: matchData.homeTeam, 
          awayTeam: matchData.awayTeam, 
          homeScore: matchData.homeScore, 
          awayScore: matchData.awayScore, 
          date: new Date() 
        },
        ...matchHistory
      ]);

      alert('Match result saved successfully!');
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error saving match: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetLeague = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This will delete all teams and cannot be undone!')) {
      return;
    }

    try {
      setSaving(true);
      
      await fetch(`${supabaseUrl}/rest/v1/match_goals?match_id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      await fetch(`${supabaseUrl}/rest/v1/matches?id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      await fetch(`${supabaseUrl}/rest/v1/team_players?team_id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      await fetch(`${supabaseUrl}/rest/v1/teams?id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      await fetch(`${supabaseUrl}/rest/v1/country_names?used=eq.true`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          used: false
        })
      });

      setTeams([]);
      setMatchHistory([]);
      await loadData();
      
      alert('League reset successfully!');
    } catch (error) {
      console.error('Error resetting league:', error);
      alert('Error resetting league. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        onLogin={handleLogin}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  const activePlayers = players.filter(p => p.active);

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
          <p className="text-gray-600">Manage teams, players, and match results</p>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('matches')}
            className={'px-6 py-3 rounded-lg font-bold transition-colors ' + (activeTab === 'matches' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100')}
          >
            Matches & Teams
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={'px-6 py-3 rounded-lg font-bold transition-colors ' + (activeTab === 'players' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100')}
          >
            Player Pool ({activePlayers.length})
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={'px-6 py-3 rounded-lg font-bold transition-colors ' + (activeTab === 'countries' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100')}
          >
            Countries ({countries.filter(c => !c.used && !c.excluded).length} available)
          </button>
        </div>

        {activeTab === 'matches' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <MatchEntryForm
                teams={teams}
                players={players}
                countries={countries}
                onMatchSaved={handleMatchSaved}
                saving={saving}
                setSaving={setSaving}
                supabaseUrl={supabaseUrl}
                supabaseKey={supabaseKey}
              />

              {matchHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
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

              {teams.length > 0 && (
                <button
                  onClick={handleResetLeague}
                  disabled={saving}
                  className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset League
                </button>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-6">
                <LeagueTable teams={teams} players={players} showPlayers={true} />
                <TopScorers 
                  players={players} 
                  supabaseUrl={supabaseUrl} 
                  supabaseKey={supabaseKey} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <PlayerManagement
            players={players}
            newPlayerName={newPlayerName}
            setNewPlayerName={setNewPlayerName}
            onAddPlayer={handleAddPlayer}
            onToggleActive={handleTogglePlayerActive}
            onDeletePlayer={handleDeletePlayer}
            saving={saving}
          />
        )}

        {activeTab === 'countries' && (
          <CountryManagement
            countries={countries}
            onToggleExcluded={handleToggleCountryExcluded}
            saving={saving}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
