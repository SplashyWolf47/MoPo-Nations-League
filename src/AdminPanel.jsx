import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

  // CHANGE THIS PASSWORD TO YOUR OWN!
  const ADMIN_PASSWORD = 'Mopoleagueadmin2025';

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
    // Check if already authenticated in this session
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
      alert('Error loading teams from database');
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
          throw new Error(`Failed to create home team: ${errorText}`);
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
            'Content-Type': 'a
