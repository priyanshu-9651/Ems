import React from 'react';

const TabSwitcher = ({ activeTab, onTabChange, disabled = false }) => {
  const tabs = [
    { key: 'signIn', label: 'Sign In' },
    { key: 'signUp', label: 'Sign Up' },
  ];

  return (
    <div className="tab-switcher">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
          disabled={disabled}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;
