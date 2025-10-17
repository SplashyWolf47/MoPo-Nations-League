import React, { useState, useEffect } from 'react';

const AdminMatchHistory = ({ players, teams, onMatchDeleted, supabaseUrl, supabaseKey }) => {
  const [matches, setMatches] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [matchGoals, setMatchGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadMatchHistory();
  }, []);

  const loadMatchHistory = async () => {
    try {
      setLoading(true);

      const [matchesRes, teamsRes, goalsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/matches?select=*&order=round.desc,id.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/teams?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/match_goals?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
      ]);

      const matchesData = await matchesRes.json();
      const teamsDataRes = await teamsRes.json();
      const goalsData = await goalsRes.json();

      setMatches(matchesData);
      setTeamsData(teamsDataRes);
      setMatchGoals(goalsData);
    } catch (error) {
      console.error('Error loading match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = teamsData.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const getGoalScorers = (matchId, teamId) => {
    const goals = matchGoals.filter(g => g.match_id === matchId && g.team_id === teamId);
    if (goals.length === 0) return null;

    const scorerMap = {};
    let ownGoals = 0;

    goals.forEach(goal => {
      if (goal.player_id === null) {
        ownGoals += goal.goals_scored;
      } else {
        if (!scorerMap[goal.player_id]) {
          scorerMap[goal.player_id] = 0;
        }
        scorerMap[goal.player_id] += goal.goals_scored;
      }
    });

    const scorers = Object.entries(scorerMap)
      .map(([playerId, goals]) => `${getPlayerName(parseInt(playerId))} (${goals})`)
      .join(', ');

    const ownGoalText = ownGoals > 0 ? `OG (${ownGoals})` : '';

    if (scorers && ownGoalText) {
      return `${scorers}, ${ownGoalText}`;
    }
    return scorers || ownGoalText || null;
  };

  const handleDeleteMatch = async (match) => {
    if (!window.confirm(`Are you sure you want to delete this match?\n${getTeamName(match.home_team_id)} ${match.home_score}-${match.away_score} ${getTeamName(match.away_team_id)}`)) {
      return;
    }

    try {
      setDeleting(match.id);

      // Delete match goals
      await fetch(`${supabaseUrl}/rest/v1/match_goals?match_id=eq.${match.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      // Get current team stats
      const homeTeam = teams.find(t => t.id === match.home_team_id);
      const awayTeam = teams.find(t => t.id === match.away_team_id);

      if (homeTeam) {
        const homeWasWin = match.home_score > match.away_score;
        const homeWasDraw = match.home_score === match.away_score;
        
        await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${homeTeam.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            played: homeTeam.played - 1,
            won: homeTeam.won - (homeWasWin ? 1 : 0),
            drawn: homeTeam.drawn - (homeWasDraw ? 1 : 0),
            lost: homeTeam.lost - (!homeWasWin && !homeWasDraw ? 1 : 0),
            goals_for: homeTeam.goalsFor - match.home_score,
            goals_against: homeTeam.goalsAgainst - match.away_score
          })
        });
      }

      if (awayTeam) {
        const awayWasWin = match.away_score > match.home_score;
        const awayWasDraw = match.home_score === match.away_score;
        
        await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${awayTeam.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            played: awayTeam.played - 1,
            won: awayTeam.won - (awayWasWin ? 1 : 0),
            drawn: awayTeam.drawn - (awayWasDraw ? 1 : 0),
            lost: awayTeam.lost - (!awayWasWin && !awayWasDraw ? 1 : 0),
            goals_for: awayTeam.goalsFor - match.away_score,
            goals_against: awayTeam.goalsAgainst - match.home_score
          })
        });
      }

      // Delete the match itself
      await fetch(`${supabaseUrl}/rest/v1/matches?id=eq.${match.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      await loadMatchHistory();
      await onMatchDeleted();
      
      alert('Match deleted successfully!');
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const groupByRound = () => {
    const grouped = {};
    matches.forEach(match => {
      const round = match.round || 1;
      if (!grouped[round]) {
        grouped[round] = [];
      }
      grouped[round].push(match);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500">Loading match history...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <p className="text-gray-500 text-lg mb-2">No matches played yet</p>
        <p className="text-gray-400">Match history will appear here once matches are recorded</p>
      </div>
    );
  }

  const matchesByRound = groupByRound();
  const rounds = Object.keys(matchesByRound).sort((a, b) => b - a);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <h2 className="text-2xl font-bold">Match History</h2>
        <p className="text-sm mt-1">{matches.length} matches played across {rounds.length} rounds</p>
      </div>

      <div className="p-6 space-y-8">
        {rounds.map(round => (
          <div key={round} className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Round {round}</h3>
            <div className="space-y-3">
              {matchesByRound[round].map(match => {
                const homeTeam = getTeamName(match.home_team_id);
                const awayTeam = getTeamName(match.away_team_id);
                const homeScorers = getGoalScorers(match.id, match.home_team_id);
                const awayScorers = getGoalScorers(match.id, match.away_team_id);

                return (
                  <div key={match.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-gray-800">{homeTeam}</span>
                      <span className="font-bold text-2xl text-purple-600 px-4">
                        {match.home_score} - {match.away_score}
                      </span>
                      <span className="font-bold text-lg text-gray-800">{awayTeam}</span>
                      <button
                        onClick={() => handleDeleteMatch(match)}
                        disabled={deleting === match.id}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-3 rounded transition-colors disabled:opacity-50"
                      >
                        {deleting === match.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    
                    {(homeScorers || awayScorers) && (
                      <div className="text-sm text-gray-600 mt-2 border-t border-gray-200 pt-2">
                        {homeScorers && (
                          <div className="mb-1">
                            <span className="font-semibold">{homeTeam}:</span> {homeScorers}
                          </div>
                        )}
                        {awayScorers && (
                          <div>
                            <span className="font-semibold">{awayTeam}:</span> {awayScorers}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMatchHistory;
