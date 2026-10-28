import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App';
import { StoreProvider } from './store';
import './styles.css';

dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      button={{ autoInsertSpace: false }}
      theme={{
        token: {
          colorPrimary: '#0f6e6b',
          colorInfo: '#143f66',
          colorLink: '#0f6e6b',
          borderRadius: 4,
          fontSize: 13,
          fontFamily: '"WenQuanYi Micro Hei", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Menu: {
            darkItemBg: '#0c2340',
            darkSubMenuItemBg: '#0a1c33',
            darkItemSelectedBg: '#0f6e6b',
            darkItemHoverBg: '#16415f',
          },
          Layout: { siderBg: '#0c2340', headerBg: '#ffffff', bodyBg: '#f3f5f7' },
          Table: { headerBg: '#f7f9fb', headerColor: '#3e5160' },
        },
      }}
    >
      <AntApp>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
