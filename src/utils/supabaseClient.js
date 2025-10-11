const supabaseUrl = 'https://drrkzqtqkzirtqokjxxx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmt6cXRxa3ppcnRxb2tqeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTc5MzksImV4cCI6MjA3NTMzMzkzOX0.HavYuWTY8kY3ErmKTuyZk93N241II5GP0LDnlG2smGA';

export const fetchFromSupabase = async (endpoint, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
};

export const loadTeams = async () => {
  const data = await fetchFromSupabase('teams?select=*&order=id.asc');
  return data.map(team => ({
    id: team.id,
    name: team.name,
    played: team.played || 0,
    won: team.won || 0,
    drawn: team.drawn || 0,
    lost: team.lost || 0,
    goalsFor: team.goals_for || 0,
    goalsAgainst: team.goals_against || 0,
    playerIds: team.player_ids || []
  }));
};

export const loadPlayers = async () => {
  return await fetchFromSupabase('players?select=*&order=name.asc');
};

export const loadCountries = async () => {
  return await fetchFromSupabase('country_names?select=*&excluded=eq.false&order=name_finnish.asc');
};

export const createTeam = async (teamData) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/teams`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(teamData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Failed to create team: ' + errorText);
  }

  return await response.json();
};

export const updateTeam = async (teamId, updates) => {
  await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${teamId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
};

export const createMatch = async (matchData) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/matches`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(matchData)
  });

  if (!response.ok) throw new Error('Failed to create match');
  return await response.json();
};

export const createMatchGoal = async (goalData) => {
  await fetch(`${supabaseUrl}/rest/v1/match_goals`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(goalData)
  });
};

export const createTeamPlayer = async (teamId, playerId) => {
  await fetch(`${supabaseUrl}/rest/v1/team_players`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      team_id: teamId,
      player_id: playerId
    })
  });
};

export const markCountryAsUsed = async (countryName, countries) => {
  const country = countries.find(c => c.name_finnish === countryName);
  if (!country) return;

  await fetch(`${supabaseUrl}/rest/v1/country_names?id=eq.${country.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ used: true })
  });
};

export const ADMIN_PASSWORD = 'GloriaPatri_Tuplamestari_2024-2025';
