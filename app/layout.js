import "./globals.css";

export const metadata = {
  title: "G Kentei Dungeon",
  description: "G検定の問題をRPG風に楽しめる、ダンジョン攻略型の学習アプリ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
