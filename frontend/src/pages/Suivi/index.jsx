import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaList, FaCog, FaArrowLeft } from 'react-icons/fa';

const SuiviMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuCards = [
    {
      title: t('suivi.menu.cards.list.title'),
      description: t('suivi.menu.cards.list.description'),
      icon: <FaList size={40} />,
      path: '/suivi/list',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: t('suivi.menu.cards.manage.title'),
      description: t('suivi.menu.cards.manage.description'),
      icon: <FaCog size={40} />,
      path: '/suivi/manage',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t('suivi.menu.back')}</span>
          </button>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {t('suivi.menu.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('suivi.menu.subtitle')}
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {menuCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            >
              <div className={`bg-gradient-to-r ${card.color} p-6 text-white`}>
                <div className="flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  {card.title}
                </h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 text-center">
                  {card.description}
                </p>
              </div>
              
              <div className="px-6 pb-6">
                <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg py-3 text-center font-semibold text-gray-700 group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300">
                  {t('common.next')} →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuiviMenu;
