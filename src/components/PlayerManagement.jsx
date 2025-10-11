import React from 'react';

const PlayerManagement = ({ 
  players, 
  newPlayerName, 
  setNewPlayerName, 
  onAddPlayer, 
  onToggleActive, 
  onDeletePlayer, 
  saving 
}) => {
  const activePlayers = players.filter(p => p.active);
  const inactivePlayers = players.filter(p => !p.active);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Player</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAddPlayer()}
            placeholder="Enter player name"
            disabled={saving}
            className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={onAddPlayer}
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
                          onClick={() => onToggleActive(player.id, player.active)}
                          disabled={saving}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark Inactive
                        </button>
                        <button
                          onClick={() => onDeletePlayer(player.id, player.name)}
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
                          onClick={() => onToggleActive(player.id, player.active)}
                          disabled={saving}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark Active
                        </button>
                        <button
                          onClick={() => onDeletePlayer(player.id, player.name)}
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
  );
};

export default PlayerManagement;
