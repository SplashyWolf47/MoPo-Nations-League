import React, { useState, useEffect } from 'react';
import LeagueTable from './components/LeagueTable';
import TopScorers from './components/TopScorers';
import { loadTeams, loadPlayers } from './utils/supabaseClient';

const PublicView = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

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
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Football League Standings</h1>
          <p className="text-gray-600 text-lg">Live league table</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <LeagueTable teams={teams} players={players} showPlayers={false} />
          </div>
          
          <div>
            <TopScorers 
              players={players} 
              supabaseUrl={supabaseUrl} 
              supabaseKey={supabaseKey} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicView;
