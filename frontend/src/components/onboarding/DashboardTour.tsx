import { useEffect, useState } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/useTheme';

const TOUR_COMPLETED_KEY = 'gravisales_dashboard_tour_completed';

export function DashboardTour() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Проверяем, проходил ли уже этот пользователь (или в этом браузере) тур
    const isCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!isCompleted) {
      // Небольшая задержка, чтобы UI успел отрендериться, включая виджеты
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">
            {t('tour.step', { current: 1, total: 5 })}
          </p>
          <h3 className="font-semibold text-lg">{t('tour.welcome.title', 'Добро пожаловать в GraviSales!')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tour.welcome.desc', 'Давайте совершим краткую экскурсию по вашему новому рабочему пространству.')}
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-sidebar',
      placement: 'right',
      content: (
        <div className="text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">
            {t('tour.step', { current: 2, total: 5 })}
          </p>
          <h3 className="font-semibold">{t('tour.sidebar.title', 'Главное меню')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tour.sidebar.desc', 'Здесь находятся все основные модули: Сделки, Клиенты, Отчеты и Настройки. Вы можете свернуть панель для экономии места.')}
          </p>
        </div>
      ),
    },
    {
      target: '#tour-funnel-widget',
      placement: 'bottom',
      content: (
        <div className="text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">
            {t('tour.step', { current: 3, total: 5 })}
          </p>
          <h3 className="font-semibold">{t('tour.funnel.title', 'Ваша воронка')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tour.funnel.desc', 'График активности показывает количество успешных сделок за последние 30 дней.')}
          </p>
        </div>
      ),
    },
    {
      target: '#tour-recent-deals',
      placement: 'left',
      content: (
        <div className="text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">
            {t('tour.step', { current: 4, total: 5 })}
          </p>
          <h3 className="font-semibold">{t('tour.deals.title', 'Мои сделки')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tour.deals.desc', 'Здесь отображаются ваши недавние открытые сделки для быстрого доступа.')}
          </p>
        </div>
      ),
    },
    {
      target: '#tour-user-menu',
      placement: 'bottom-end',
      content: (
        <div className="text-left space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">
            {t('tour.step', { current: 5, total: 5 })}
          </p>
          <h3 className="font-semibold">{t('tour.profile.title', 'Ваш профиль')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tour.profile.desc', 'Здесь вы можете изменить язык интерфейса, переключить тему (светлую/темную) или выйти из аккаунта.')}
          </p>
        </div>
      ),
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      // Запоминаем, что тур пройден
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      setRun(false);
    }
  };

  const isDarkMode = theme === 'dark';

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5', // indigo-600
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 or white
          textColor: isDarkMode ? '#f3f4f6' : '#111827', // gray-100 or gray-900
          arrowColor: isDarkMode ? '#1f2937' : '#ffffff',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
        },
        buttonBack: {
          color: isDarkMode ? '#9ca3af' : '#4b5563', // gray-400 or gray-600
        },
        buttonSkip: {
          color: isDarkMode ? '#ef4444' : '#dc2626', // red-500 or red-600
        }
      }}
      locale={{
        back: t('tour.btn.back', 'Назад'),
        close: t('tour.btn.close', 'Закрыть'),
        last: t('tour.btn.last', 'Завершить'),
        next: t('tour.btn.next', 'Далее'),
        skip: t('tour.btn.skip', 'Пропустить тур'),
      }}
    />
  );
}
