import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

  const ADMIN_PASSWORD = 'GloriaPatri_Tuplamestari_2024-2025';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [matchHistory, setMatchHistory] = useState([]);
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [awayTeamSearch, setAwayTeamSearch] = useState('');
  const [showHomeCountries, setShowHomeCountries] = useState(false);
  const [showAwayCountries, setShowAwayCountries] = useState(false);
  const [homeTeamMode, setHomeTeamMode] = useState('existing');
  const [awayTeamMode, setAwayTeamMode] = useState('existing');
  const [selectedHomePlayers, setSelectedHomePlayers] = useState([]);
  const [selectedAwayPlayers, setSelectedAwayPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showGoalScorers, setShowGoalScorers] = useState(false);
  const [homeGoalScorers, setHomeGoalScorers] = useState({});
  const [awayGoalScorers, setAwayGoalScorers] = useState({});

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadTeams();
      loadPlayers();
      loadCountries();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      loadTeams();
      loadPlayers();
      loadCountries();
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
        goalsAgainst: team.goals_against || 0,
        playerIds: team.player_ids || []
      })));
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/players?select=*&order=name.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to load players');

      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/country_names?select=*&excluded=eq.false&order=name_finnish.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to load countries');

      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const getAvailableCountries = () => {
    return countries.filter(c => !c.used && !c.excluded);
  };

  const getFilteredHomeCountries = () => {
    const available = getAvailableCountries();
    if (!homeTeamSearch) return available;
    return available.filter(c => 
      c.name_finnish.toLowerCase().includes(homeTeamSearch.toLowerCase())
    );
  };

  const getFilteredAwayCountries = () => {
    const available = getAvailableCountries();
    if (!awayTeamSearch) return available;
    return available.filter(c => 
      c.name_finnish.toLowerCase().includes(awayTeamSearch.toLowerCase())
    );
  };

  const selectHomeCountry = (countryName) => {
    setNewHomeTeam(countryName);
    setHomeTeamSearch(countryName);
    setShowHomeCountries(false);
  };

  const selectAwayCountry = (countryName) => {
    setNewAwayTeam(countryName);
    setAwayTeamSearch(countryName);
    setShowAwayCountries(false);
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      alert('Please enter a player name');
      return;
    }

    // Check for duplicate player name (case-insensitive)
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

      await loadPlayers();
      setNewPlayerName('');
      alert('Player added successfully!');
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Error adding player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePlayerActive = async (playerId, currentStatus) => {
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

      await loadPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deletePlayer = async (playerId, playerName) => {
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

      await loadPlayers();
      alert('Player deleted successfully!');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayerSelection = (playerId, isHome) => {
    const selectedList = isHome ? selectedHomePlayers : selectedAwayPlayers;
    const setSelected = isHome ? setSelectedHomePlayers : setSelectedAwayPlayers;

    if (selectedList.includes(playerId)) {
      setSelected(selectedList.filter(id => id !== playerId));
    } else if (selectedList.length < 3) {
      setSelected([...selectedList, playerId]);
    } else {
      alert('You can only select 3 players per team');
    }
  };

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

  const markCountryAsUsed = async (countryName) => {
    try {
      const country = countries.find(c => c.name_finnish === countryName);
      if (!country) return;

      await fetch(`${supabaseUrl}/rest/v1/country_names?id=eq.${country.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          used: true
        })
      });

      await loadCountries();
    } catch (error) {
      console.error('Error marking country as used:', error);
    }
  };

  const addMatchResult = async () => {
    let finalHomeTeam = '';
    let finalAwayTeam = '';
    let homeTeamData = null;
    let awayTeamData = null;

    if (homeTeamMode === 'new') {
      if (!newHomeTeam.trim()) {
        alert('Please enter a home team name');
        return;
      }
      if (selectedHomePlayers.length !== 3) {
        alert('Please select exactly 3 players for the home team');
        return;
      }
      
      const sortedHomePlayers = [...selectedHomePlayers].sort();
      const existingTeamWithSamePlayers = teams.find(team => {
        if (!team.playerIds || team.playerIds.length !== 3) return false;
        const sortedTeamPlayers = [...team.playerIds].sort();
        return sortedTeamPlayers.every((id, idx) => id === sortedHomePlayers[idx]);
      });
      
      if (existingTeamWithSamePlayers) {
        const playerNames = selectedHomePlayers.map(id => getPlayerName(id)).join(', ');
        alert(`These players (${playerNames}) already form a team called "${existingTeamWithSamePlayers.name}". Please select different players or use the existing team.`);
        return;
      }
      
      finalHomeTeam = newHomeTeam.trim();
    } else {
      if (!homeTeam) {
        alert('Please select a home team');
        return;
      }
      finalHomeTeam = homeTeam;
      homeTeamData = teams.find(t => t.name === finalHomeTeam);
    }

    if (awayTeamMode === 'new') {
      if (!newAwayTeam.trim()) {
        alert('Please enter an away team name');
        return;
      }
      if (selectedAwayPlayers.length !== 3) {
        alert('Please select exactly 3 players for the away team');
        return;
      }
      
      const sortedAwayPlayers = [...selectedAwayPlayers].sort();
      const existingTeamWithSamePlayers = teams.find(team => {
        if (!team.playerIds || team.playerIds.length !== 3) return false;
        const sortedTeamPlayers = [...team.playerIds].sort();
        return sortedTeamPlayers.every((id, idx) => id === sortedAwayPlayers[idx]);
      });
      
      if (existingTeamWithSamePlayers) {
        const playerNames = selectedAwayPlayers.map(id => getPlayerName(id)).join(', ');
        alert(`These players (${playerNames}) already form a team called "${existingTeamWithSamePlayers.name}". Please select different players or use the existing team.`);
        return;
      }
      
      finalAwayTeam = newAwayTeam.trim();
    } else {
      if (!awayTeam) {
        alert('Please select an away team');
        return;
      }
      finalAwayTeam = awayTeam;
      awayTeamData = teams.find(t => t.name === finalAwayTeam);
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

    if (!showGoalScorers) {
      if (homeGoals > 0 || awayGoals > 0) {
        setShowGoalScorers(true);
        setHomeGoalScorers({});
        setAwayGoalScorers({});
        return;
      }
    }

    const totalHomeGoalsAssigned = Object.values(homeGoalScorers).reduce((sum, goals) => sum + goals, 0);
    const totalAwayGoalsAssigned = Object.values(awayGoalScorers).reduce((sum, goals) => sum + goals, 0);

    if (totalHomeGoalsAssigned !== homeGoals) {
      alert(`Please assign all ${homeGoals} home team goals to players. Currently assigned: ${totalHomeGoalsAssigned}`);
      return;
    }

    if (totalAwayGoalsAssigned !== awayGoals) {
      alert(`Please assign all ${awayGoals} away team goals to players. Currently assigned: ${totalAwayGoalsAssigned}`);
      return;
    }

    try {
      setSaving(true);

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
            goals_against: 0,
            player_ids: '{' + selectedHomePlayers.join(',') + '}'
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
          goalsAgainst: 0,
          playerIds: selectedHomePlayers
        };

        for (const playerId of selectedHomePlayers) {
          await fetch(`${supabaseUrl}/rest/v1/team_players`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              team_id: homeTeamData.id,
              player_id: playerId
            })
          });
        }

        await markCountryAsUsed(finalHomeTeam);
      }

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
            goals_against: 0,
            player_ids: '{' + selectedAwayPlayers.join(',') + '}'
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
          goalsAgainst: 0,
          playerIds: selectedAwayPlayers
        };

        for (const playerId of selectedAwayPlayers) {
          await fetch(`${supabaseUrl}/rest/v1/team_players`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              team_id: awayTeamData.id,
              player_id: playerId
            })
          });
        }

        await markCountryAsUsed(finalAwayTeam);
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
      setHomeTeamSearch('');
      setAwayTeamSearch('');
      setSelectedHomePlayers([]);
      setSelectedAwayPlayers([]);
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
    if (!window.confirm('Are you sure you want to reset all data? This will delete all teams and cannot be undone!')) {
      return;
    }

    try {
      setSaving(true);
      
      await fetch(`${supabaseUrl}/rest/v1/team_players?team_id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const response = await fetch(`${supabaseUrl}/rest/v1/teams?id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to reset league');

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
      await loadCountries();
      
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
        </div>
      </div>
    );
  }

  const sortedTeams = getSortedTeams();
  const activePlayers = players.filter(p => p.active);
  const inactivePlayers = players.filter(p => !p.active);

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
            Countries ({getAvailableCountries().length} available)
          </button>
        </div>

        {activeTab === 'matches' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Match Result</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Home Team</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => {
                          setHomeTeamMode('existing');
                          setSelectedHomePlayers([]);
                          setHomeTeamSearch('');
                          setNewHomeTeam('');
                        }}
                        disabled={saving}
                        className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (homeTeamMode === 'existing' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                      >
                        Existing
                      </button>
                      <button
                        onClick={() => {
                          setHomeTeamMode('new');
                          setSelectedHomePlayers([]);
                          setHomeTeamSearch('');
                          setNewHomeTeam('');
                        }}
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
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={homeTeamSearch}
                            onChange={(e) => {
                              setHomeTeamSearch(e.target.value);
                              setNewHomeTeam('');
                              setShowHomeCountries(true);
                            }}
                            onFocus={() => setShowHomeCountries(true)}
                            placeholder="Type country name..."
                            disabled={saving}
                            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50 mb-1"
                          />
                          {newHomeTeam && (
                            <div className="text-xs text-green-600 font-semibold mb-2">
                              Selected: {newHomeTeam}
                            </div>
                          )}
                          {showHomeCountries && homeTeamSearch && (
                            <div className="absolute z-10 w-full bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {getFilteredHomeCountries().length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm">No countries found</div>
                              ) : (
                                getFilteredHomeCountries().map(country => (
                                  <button
                                    key={country.id}
                                    onClick={() => selectHomeCountry(country.name_finnish)}
                                    className="w-full text-left px-3 py-2 hover:bg-green-100 border-b border-gray-100 text-sm"
                                  >
                                    {country.name_finnish}
                                    <span className="text-xs text-gray-500 ml-2">({country.name_english})</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        
                        {newHomeTeam && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Select 3 players ({selectedHomePlayers.length}/3):
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {activePlayers.map(player => (
                                <button
                                  key={player.id}
                                  onClick={() => handlePlayerSelection(player.id, true)}
                                  disabled={saving}
                                  className={'w-full text-left px-3 py-2 rounded text-sm transition-colors ' + (selectedHomePlayers.includes(player.id) ? 'bg-green-500 text-white font-semibold' : 'bg-white hover:bg-gray-100 text-gray-700')}
                                >
                                  {player.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                        onClick={() => {
                          setAwayTeamMode('existing');
                          setSelectedAwayPlayers([]);
                          setAwayTeamSearch('');
                          setNewAwayTeam('');
                        }}
                        disabled={saving}
                        className={'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ' + (awayTeamMode === 'existing' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + (saving ? ' opacity-50 cursor-not-allowed' : '')}
                      >
                        Existing
                      </button>
                      <button
                        onClick={() => {
                          setAwayTeamMode('new');
                          setSelectedAwayPlayers([]);
                          setAwayTeamSearch('');
                          setNewAwayTeam('');
                        }}
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
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={awayTeamSearch}
                            onChange={(e) => {
                              setAwayTeamSearch(e.target.value);
                              setNewAwayTeam('');
                              setShowAwayCountries(true);
                            }}
                            onFocus={() => setShowAwayCountries(true)}
                            placeholder="Type country name..."
                            disabled={saving}
                            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50 mb-1"
                          />
                          {newAwayTeam && (
                            <div className="text-xs text-green-600 font-semibold mb-2">
                              Selected: {newAwayTeam}
                            </div>
                          )}
                          {showAwayCountries && awayTeamSearch && (
                            <div className="absolute z-10 w-full bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {getFilteredAwayCountries().length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm">No countries found</div>
                              ) : (
                                getFilteredAwayCountries().map(country => (
                                  <button
                                    key={country.id}
                                    onClick={() => selectAwayCountry(country.name_finnish)}
                                    className="w-full text-left px-3 py-2 hover:bg-green-100 border-b border-gray-100 text-sm"
                                  >
                                    {country.name_finnish}
                                    <span className="text-xs text-gray-500 ml-2">({country.name_english})</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        
                        {newAwayTeam && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Select 3 players ({selectedAwayPlayers.length}/3):
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {activePlayers.map(player => (
                                <button
                                  key={player.id}
                                  onClick={() => handlePlayerSelection(player.id, false)}
                                  disabled={saving}
                                  className={'w-full text-left px-3 py-2 rounded text-sm transition-colors ' + (selectedAwayPlayers.includes(player.id) ? 'bg-green-500 text-white font-semibold' : 'bg-white hover:bg-gray-100 text-gray-700')}
                                >
                                  {player.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Players</th>
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
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {team.playerIds && team.playerIds.length > 0
                                    ? team.playerIds.map(id => getPlayerName(id)).join(', ')
                                    : 'No players assigned'}
                                </td>
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
        )}

        {activeTab === 'players' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Player</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter player name"
                  disabled={saving}
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={addPlayer}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Player Pool</h2>
              
              {players.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No players in the pool yet</p>
                  <p className="text-gray-400 text-sm mt-2">Add your first player above</p>
                </div>
              ) : (
                <>
                  {activePlayers.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Active Players ({activePlayers.length})</h3>
                      <div className="grid gap-3">
                        {activePlayers.map(player => (
                          <div key={player.id} className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                            <span className="text-lg font-semibold text-gray-800">{player.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePlayerActive(player.id, player.active)}
                                disabled={saving}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Mark Inactive
                              </button>
                              <button
                                onClick={() => deletePlayer(player.id, player.name)}
                                disabled={saving}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {inactivePlayers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Inactive Players ({inactivePlayers.length})</h3>
                      <div className="grid gap-3">
                        {inactivePlayers.map(player => (
                          <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-60">
                            <span className="text-lg font-semibold text-gray-600">{player.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePlayerActive(player.id, player.active)}
                                disabled={saving}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Mark Active
                              </button>
                              <button
                                onClick={() => deletePlayer(player.id, player.name)}
                                disabled={saving}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Country Management</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{getAvailableCountries().length}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{countries.filter(c => c.used).length}</p>
                  <p className="text-sm text-gray-600">Used as Teams</p>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">{countries.filter(c => c.excluded).length}</p>
                  <p className="text-sm text-gray-600">Excluded</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Click on any country to toggle its excluded status. Excluded countries cannot be used as team names.
                </p>
                
                <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {countries.map(country => (
                    <button
                      key={country.id}
                      onClick={async () => {
                        if (country.used) {
                          alert('This country is already used as a team name and cannot be excluded.');
                          return;
                        }
                        try {
                          setSaving(true);
                          await fetch(`${supabaseUrl}/rest/v1/country_names?id=eq.${country.id}`, {
                            method: 'PATCH',
                            headers: {
                              'apikey': supabaseKey,
                              'Authorization': `Bearer ${supabaseKey}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              excluded: !country.excluded
                            })
                          });
                          await loadCountries();
                        } catch (error) {
                          console.error('Error updating country:', error);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving || country.used}
                      className={'p-3 rounded-lg text-left text-sm transition-colors ' + 
                        (country.used ? 'bg-blue-100 border-2 border-blue-300 text-blue-800 cursor-not-allowed' : 
                        country.excluded ? 'bg-red-100 border-2 border-red-300 text-red-800 hover:bg-red-200' : 
                        'bg-green-50 border-2 border-green-200 text-gray-800 hover:bg-green-100')}
                    >
                      <div className="font-semibold">{country.name_finnish}</div>
                      <div className="text-xs text-gray-600">{country.name_english}</div>
                      {country.used && <div className="text-xs font-semibold text-blue-600 mt-1">Used as team</div>}
                      {country.excluded && <div className="text-xs font-semibold text-red-600 mt-1">Excluded</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
