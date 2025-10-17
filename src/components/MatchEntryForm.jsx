import React, { useState } from 'react';

const MatchEntryForm = ({ 
  teams, 
  players, 
  countries,
  onMatchSaved,
  saving,
  setSaving,
  supabaseUrl,
  supabaseKey
}) => {
  const [matchStep, setMatchStep] = useState(1);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
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
  const [homeGoalScorers, setHomeGoalScorers] = useState({});
  const [awayGoalScorers, setAwayGoalScorers] = useState({});
  const [round, setRound] = useState('1');
  const [homeOwnGoals, setHomeOwnGoals] = useState(0);
  const [awayOwnGoals, setAwayOwnGoals] = useState(0);
  
  const activePlayers = players.filter(p => p.active);

  const getAvailableCountries = () => {
    return countries.filter(c => !c.used && !c.excluded);
  };

  const getFilteredCountries = (searchTerm) => {
    const available = getAvailableCountries();
    if (!searchTerm) return available;
    return available.filter(c => 
      c.name_finnish.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectCountry = (countryName, isHome) => {
    if (isHome) {
      setNewHomeTeam(countryName);
      setHomeTeamSearch(countryName);
      setShowHomeCountries(false);
    } else {
      setNewAwayTeam(countryName);
      setAwayTeamSearch(countryName);
      setShowAwayCountries(false);
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

  const validateAndProceedToGoals = () => {
    let finalHomeTeam = homeTeamMode === 'new' ? newHomeTeam.trim() : homeTeam;
    let finalAwayTeam = awayTeamMode === 'new' ? newAwayTeam.trim() : awayTeam;
    let homeTeamData = teams.find(t => t.name === finalHomeTeam);
    let awayTeamData = teams.find(t => t.name === finalAwayTeam);

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
    } else {
      if (!homeTeam) {
        alert('Please select a home team');
        return;
      }
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
    } else {
      if (!awayTeam) {
        alert('Please select an away team');
        return;
      }
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

    if (homeGoals === 0 && awayGoals === 0) {
      handleSaveMatch();
      return;
    }

    const homePlayersList = homeTeamMode === 'new' ? selectedHomePlayers : (homeTeamData ? homeTeamData.playerIds : []);
    const awayPlayersList = awayTeamMode === 'new' ? selectedAwayPlayers : (awayTeamData ? awayTeamData.playerIds : []);

    const initialHomeScorers = {};
    const initialAwayScorers = {};
    
    homePlayersList.forEach(pid => { initialHomeScorers[pid] = 0; });
    awayPlayersList.forEach(pid => { initialAwayScorers[pid] = 0; });

    setHomeGoalScorers(initialHomeScorers);
    setAwayGoalScorers(initialAwayScorers);
    setMatchStep(2);
  };

  const updateGoalScorer = (playerId, goals, isHome) => {
    const scorers = isHome ? homeGoalScorers : awayGoalScorers;
    const setScorers = isHome ? setHomeGoalScorers : setAwayGoalScorers;
    
    const value = parseInt(goals) || 0;
    setScorers({
      ...scorers,
      [playerId]: value >= 0 ? value : 0
    });
  };

  const handleSaveMatch = async () => {
    const finalHomeTeam = homeTeamMode === 'new' ? newHomeTeam.trim() : homeTeam;
    const finalAwayTeam = awayTeamMode === 'new' ? newAwayTeam.trim() : awayTeam;
    const homeGoals = parseInt(homeScore);
    const awayGoals = parseInt(awayScore);

if (matchStep === 2 && (homeGoals > 0 || awayGoals > 0)) {
      const totalHomePlayerGoals = Object.values(homeGoalScorers).reduce((sum, g) => sum + g, 0);
      const totalAwayPlayerGoals = Object.values(awayGoalScorers).reduce((sum, g) => sum + g, 0);
      const totalHomeGoals = totalHomePlayerGoals + homeOwnGoals;
      const totalAwayGoals = totalAwayPlayerGoals + awayOwnGoals;

      if (totalHomeGoals !== homeGoals) {
        alert(`Home team goals don't match. Expected: ${homeGoals}, Assigned: ${totalHomeGoals} (${totalHomePlayerGoals} player goals + ${homeOwnGoals} own goals)`);
        return;
      }

      if (totalAwayGoals !== awayGoals) {
        alert(`Away team goals don't match. Expected: ${awayGoals}, Assigned: ${totalAwayGoals} (${totalAwayPlayerGoals} player goals + ${awayOwnGoals} own goals)`);
        return;
      }
    }

    await onMatchSaved({
      homeTeam: finalHomeTeam,
      awayTeam: finalAwayTeam,
      homeScore: homeGoals,
      awayScore: awayGoals,
      round: parseInt(round),
      homeOwnGoals: homeOwnGoals,
      awayOwnGoals: awayOwnGoals,      
      homeTeamMode,
      awayTeamMode,
      selectedHomePlayers,
      selectedAwayPlayers,
      homeGoalScorers,
      awayGoalScorers
    });

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
    setMatchStep(1);
    setHomeGoalScorers({});
    setAwayGoalScorers({});
    setRound('1');
  };

  //This looks like the cleanup, resetting everything
  const goBack = () => { 
    setMatchStep(1);
    setHomeGoalScorers({});
    setAwayGoalScorers({});
    setHomeOwnGoals(0);
    setAwayOwnGoals(0);
  };

  const finalHomeTeam = homeTeamMode === 'new' ? newHomeTeam : homeTeam;
  const finalAwayTeam = awayTeamMode === 'new' ? newAwayTeam : awayTeam;
  const homeTeamData = teams.find(t => t.name === finalHomeTeam);
  const awayTeamData = teams.find(t => t.name === finalAwayTeam);
  const homePlayersList = homeTeamMode === 'new' ? selectedHomePlayers : (homeTeamData ? homeTeamData.playerIds : []);
  const awayPlayersList = awayTeamMode === 'new' ? selectedAwayPlayers : (awayTeamData ? awayTeamData.playerIds : []);

  if (matchStep === 2) {
    const homeGoals = parseInt(homeScore);
    const awayGoals = parseInt(awayScore);
    const totalHomeAssigned = Object.values(homeGoalScorers).reduce((sum, g) => sum + g, 0) + homeOwnGoals;
    const totalAwayAssigned = Object.values(awayGoalScorers).reduce((sum, g) => sum + g, 0) + awayOwnGoals;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <button
            onClick={goBack}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Match Details
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Assign Goal Scorers</h2>
        <p className="text-gray-600 mb-6">
          {finalHomeTeam} {homeGoals} - {awayGoals} {finalAwayTeam}
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              {finalHomeTeam} ({totalHomeAssigned}/{homeGoals} goals assigned)
            </h3>
            {homePlayersList.map(playerId => (
              <div key={playerId} className="flex items-center justify-between mb-3 bg-white p-3 rounded-lg">
                <span className="font-semibold text-gray-800">{getPlayerName(playerId)}</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Goals:</label>
                  <input
                    type="number"
                    min="0"
                    value={homeGoalScorers[playerId] || 0}
                    onChange={(e) => updateGoalScorer(playerId, e.target.value, true)}
                    className="w-16 p-2 border-2 border-gray-300 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-lg border-2 border-orange-300">
              <span className="font-semibold text-orange-700">Own Goals</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Goals:</label>
                <input
                  type="number"
                  min="0"
                  value={homeOwnGoals}
                  onChange={(e) => setHomeOwnGoals(parseInt(e.target.value) || 0)}
                  className="w-16 p-2 border-2 border-gray-300 rounded-lg text-center font-bold"
                />
              </div>
            </div>            
          </div>

          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              {finalAwayTeam} ({totalAwayAssigned}/{awayGoals} goals assigned)
            </h3>
            {awayPlayersList.map(playerId => (
              <div key={playerId} className="flex items-center justify-between mb-3 bg-white p-3 rounded-lg">
                <span className="font-semibold text-gray-800">{getPlayerName(playerId)}</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Goals:</label>
                  <input
                    type="number"
                    min="0"
                    value={awayGoalScorers[playerId] || 0}
                    onChange={(e) => updateGoalScorer(playerId, e.target.value, false)}
                    className="w-16 p-2 border-2 border-gray-300 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-lg border-2 border-orange-300">
              <span className="font-semibold text-orange-700">Own Goals</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Goals:</label>
                <input
                  type="number"
                  min="0"
                  value={awayOwnGoals}
                  onChange={(e) => setAwayOwnGoals(parseInt(e.target.value) || 0)}
                  className="w-16 p-2 border-2 border-gray-300 rounded-lg text-center font-bold"
                />
              </div>
            </div>            
          </div>
        </div>

        <button
          onClick={handleSaveMatch}
          disabled={saving || totalHomeAssigned !== homeGoals || totalAwayAssigned !== awayGoals}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving Match...' : 'Save Match'}
        </button>

        {(totalHomeAssigned !== homeGoals || totalAwayAssigned !== awayGoals) && (
          <p className="text-red-600 text-sm mt-2 text-center">
            Please assign all goals before saving
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
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
                    {getFilteredCountries(homeTeamSearch).length === 0 ? (
                      <div className="p-3 text-gray-500 text-sm">No countries found</div>
                    ) : (
                      getFilteredCountries(homeTeamSearch).map(country => (
                        <button
                          key={country.id}
                          onClick={() => selectCountry(country.name_finnish, true)}
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Round / Matchday</label>
          <input
            type="number"
            min="1"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            disabled={saving}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-center text-lg font-bold disabled:opacity-50"
            placeholder="1"
          />
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
                    {getFilteredCountries(awayTeamSearch).length === 0 ? (
                      <div className="p-3 text-gray-500 text-sm">No countries found</div>
                    ) : (
                      getFilteredCountries(awayTeamSearch).map(country => (
                        <button
                          key={country.id}
                          onClick={() => selectCountry(country.name_finnish, false)}
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
          onClick={validateAndProceedToGoals}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {parseInt(homeScore) === 0 && parseInt(awayScore) === 0 ? 'Save Match (0-0)' : 'Next: Assign Goal Scorers →'}
        </button>
      </div>
    </div>
  );
};

export default MatchEntryForm;
