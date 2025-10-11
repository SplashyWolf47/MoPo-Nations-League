import React, { useState, useEffect } from 'react';
import LeagueTable from './components/LeagueTable';
import { loadTeams, loadPlayers } from './utils/supabaseClient';

const PublicView = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3600000); // Refresh every 60 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [teamsData, playersData] = await Promise.all([
        loadTeams(),
        loadPlayers()
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

        <LeagueTable teams={teams} players={players} showPlayers={true} />
      </div>
    </div>
  );
};

export default PublicView;
