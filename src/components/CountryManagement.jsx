import React from 'react';

const CountryManagement = ({ countries, onToggleExcluded, saving, supabaseUrl, supabaseKey }) => {
  const getAvailableCountries = () => {
    return countries.filter(c => !c.used && !c.excluded);
  };

  const handleToggle = async (country) => {
    if (country.used) {
      alert('This country is already used as a team name and cannot be excluded.');
      return;
    }
    await onToggleExcluded(country.id, country.excluded);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Country Management</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
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

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Click on any country to toggle its excluded status. Excluded countries cannot be used as team names.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {countries.map(country => (
            <button
              key={country.id}
              onClick={() => handleToggle(country)}
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
  );
};

export default CountryManagement;
