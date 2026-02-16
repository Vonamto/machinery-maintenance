import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaList, FaPlus } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { PAGE_PERMISSIONS } from '@/config/roles';

const SuiviMenu = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVI.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  const cards = [
    {
      title: t('suivi.menu.cards.list.title'),
      description: t('suivi.menu.cards.list.description'),
      link: '/suivi/list',
      icon: <FaList className="w-8 h-8 text-white" />,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'shadow-[0_0_15px_2px_rgba(59,130,246,0.6)]',
      allowed: PAGE_PERMISSIONS.SUIVILIST,
    },
    {
      title: t('suivi.menu.cards.manage.title'),
      description: t('suivi.menu.cards.manage.description'),
      link: '/suivi/manage',
      icon: <FaPlus className="w-8 h-8 text-white" />,
      gradient: 'from-green-600 to-emerald-500',
      glow: 'shadow-[0_0_15px_2px_rgba(16,185,129,0.6)]',
      allowed: PAGE_PERMISSIONS.SUIVIMANAGE,
    },
  ];

  const visibleCards = cards.filter((card) => card.allowed.includes(user?.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <Navbar user={user} />

      <div className="p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>{t('suivi.menu.back')}</span>
        </button>

        <h1 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
          {t('suivi.menu.title')}
        </h1>
        <p className="text-gray-400 mb-8">{t('suivi.menu.subtitle')}</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">  {/* ✅ Added mx-auto */}
          {visibleCards.map((card) => (
            <Link to={card.link} key={card.link}>
              <Card
                className={`rounded-2xl bg-gradient-to-br ${card.gradient} ${card.glow} hover:scale-[1.04] hover:brightness-110 transition-all duration-300 border border-white/10`}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white drop-shadow-md">
                    {card.title}
                  </h2>
                  <p className="text-gray-100/90 text-sm">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuiviMenu;
