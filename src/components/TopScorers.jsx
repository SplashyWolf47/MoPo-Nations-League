import React, { useState, useEffect } from 'react';

const TopScorers = ({ players, supabaseUrl, supabaseKey }) => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerStats();
  }, []);

  const loadPlayerStats = async () => {
    try {
      setLoading(true);
      
      // Get all match goals
      const goalsResponse = await fetch(`${supabaseUrl}/rest/v1/match_goals?select=player_id,goals_scored,match_id`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!goalsResponse.ok) throw new Error('Failed to load goals');
      const goalsData = await goalsResponse.json();

      // Calculate stats per player
      const statsMap = {};
      const matchesPerPlayer = {};

      goalsData.forEach(goal => {
        const playerId = goal.player_id;
        
        if (!statsMap[playerId]) {
          statsMap[playerId] = 0;
        }
        if (!matchesPerPlayer[playerId]) {
          matchesPerPlayer[playerId] = new Set();
        }
        
        statsMap[playerId] += goal.goals_scored;
        matchesPerPlayer[playerId].add(goal.match_id);
      });

      // Convert to array and add player names
      const stats = Object.keys(statsMap).map(playerId => {
        const player = players.find(p => p.id === parseInt(playerId));
        return {
          playerId: parseInt(playerId),
          playerName: player ? player.name : 'Unknown',
          goals: statsMap[playerId],
          matches: matchesPerPlayer[playerId].size
        };
      });

      // Sort by goals (desc), then matches (asc)
      stats.sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return a.matches - b.matches;
      });

      setPlayerStats(stats);
    } catch (error) {
      console.error('Error loading player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
          <h2 className="text-2xl font-bold">Top Scorers</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (playerStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
          <h2 className="text-2xl font-bold">Top Scorers</h2>
        </div>
        <div className="p-12 text-center">
          <p className="text-gray-500 text-lg">No goals scored yet</p>
          <p className="text-gray-400 text-sm mt-2">Goals will appear here once matches are played</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
        <h2 className="text-2xl font-bold">Top Scorers</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Player</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Matches</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Goals</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Goals/Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {playerStats.map((stat, index) => {
              const goalsPerMatch = (stat.goals / stat.matches).toFixed(2);
              let rowColor = '';
              if (index === 0) rowColor = 'bg-yellow-50';
              else if (index === 1) rowColor = 'bg-gray-50';
              else if (index === 2) rowColor = 'bg-orange-50';

              return (
                <tr key={stat.playerId} className={rowColor + ' hover:bg-gray-50 transition-colors'}>
                  <td className="px-6 py-4 text-center font-bold text-lg text-gray-700">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-lg text-gray-900">{stat.playerName}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{stat.matches}</td>
                  <td className="px-6 py-4 text-center font-bold text-xl text-orange-600">{stat.goals}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{goalsPerMatch}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 text-xs text-gray-600 border-t border-gray-200">
        <p className="font-semibold mb-2">Sorted by: Goals Scored (descending) → Matches Played (ascending)</p>
        <p className="text-gray-500">🥇 Gold = 1st place • 🥈 Silver = 2nd place • 🥉 Bronze = 3rd place</p>
      </div>
    </div>
  );
};

export default TopScorers;
