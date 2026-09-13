"""Exercise the production data and SQL against an isolated SQLite database."""
import collections, json, sqlite3, pathlib, re, time, unittest
root=pathlib.Path(__file__).resolve().parents[1]
source=(root/'app/api/club/route.ts').read_text()
pick_sql=re.search(r'`(INSERT INTO picks.*?)`',source,re.S).group(1)
unpick_sql=re.search(r'`(DELETE FROM picks WHERE league=\?.*?)`',source,re.S).group(1)
score_sql=re.search(r'`(SELECT p.id,p.name,p.favorite_team favoriteTeam,COALESCE.*?)`',source,re.S).group(1)
reveal_sql=re.search(r'`(SELECT p.user,p.game,p.team FROM picks.*?UNION ALL.*?)`',source,re.S).group(1)
publication_sql=re.search(r'`(INSERT INTO published_pick_entries.*?)`',source,re.S).group(1)
favorite_loss_sql=re.search(r'`(SELECT k.user,g.week FROM picks k JOIN profiles p.*?)`',source,re.S).group(1)
missed_pick_sql=re.search(r'`(SELECT m.user,g.week FROM members m CROSS JOIN games g.*?)`',source,re.S).group(1)
class Rules(unittest.TestCase):
 def test_complete_official_schedule(self):
  games=json.loads((root/'lib/schedule-2026.json').read_text())
  expected={2:16,3:16,4:16,5:15,6:14,7:14,8:14,9:15,10:14,11:13,12:16,13:14,14:15,15:16,16:16,17:16,18:16}
  self.assertEqual(dict(collections.Counter(g['week'] for g in games)),expected)
  self.assertEqual(len(games),256)
  self.assertEqual(len({g['id'] for g in games}),256)
  self.assertEqual(len({g[side] for g in games for side in ('away','home')}),32)
  self.assertEqual((games[0]['away'],games[0]['home']),('DET','BUF'))
 def test_badge_settings_default_and_override(self):
  self.db.execute("INSERT INTO league_badge_settings VALUES('l','wild-picker',0)")
  row=self.db.execute("SELECT enabled FROM league_badge_settings WHERE league='l' AND badge='wild-picker'").fetchone()
  self.assertEqual(row['enabled'],0)
 def setUp(self):
  self.db=sqlite3.connect(':memory:');self.db.row_factory=sqlite3.Row
  for migration in sorted((root/'drizzle').glob('*.sql')):
   self.db.executescript(migration.read_text())
  self.db.executemany('INSERT INTO profiles(id,name) VALUES(?,?)',[('a','Alice'),('b','Bob'),('c','Chris')])
  self.db.executemany('INSERT INTO leagues(id,name,owner,code,season) VALUES(?,?,?,?,?)',[('l','League','a','CODE',2026),('other','Other','c','OTHER',2026)])
  self.db.executemany('INSERT INTO members(league,user) VALUES(?,?)',[('l','a'),('l','b'),('other','c')])
  self.now=int(time.time())*1000
  self.db.executemany('INSERT INTO games VALUES(?,?,?,?,?,?,?)',[('future',2,'KC','BUF',self.now+100000,'scheduled',None),('locked',2,'KC','BUF',self.now,'scheduled',None),('past',1,'KC','BUF',self.now-100000,'final','KC')])
 def pick(self,user='a',game='future',team='KC'):
  return self.db.execute(pick_sql,('l',user,team,game,team,'l',user,'l')).rowcount
 def test_change_before_kickoff(self):
  self.assertEqual(self.pick(),1);self.assertEqual(self.pick(team='BUF'),1)
  self.assertEqual(self.db.execute('SELECT count(*) FROM picks').fetchone()[0],1)
  self.assertEqual(self.db.execute('SELECT team FROM picks').fetchone()[0],'BUF')
  self.assertEqual(self.db.execute(unpick_sql,('l','a','future','l','future')).rowcount,1)
  self.assertEqual(self.db.execute('SELECT count(*) FROM picks').fetchone()[0],0)
 def test_kickoff_boundary_and_past(self):
  self.assertEqual(self.pick(game='locked'),0);self.assertEqual(self.pick(game='past'),0)
  self.db.execute("INSERT INTO picks VALUES('l','a','locked','KC')")
  self.assertEqual(self.db.execute(unpick_sql,('l','a','locked','l','locked')).rowcount,0)
 def test_invalid_team_and_nonmember(self):
  self.assertEqual(self.pick(team='DAL'),0);self.assertEqual(self.pick(user='c'),0)
 def test_cancelled_game(self):
  self.db.execute("INSERT INTO results VALUES('l','future',NULL,'cancelled')")
  self.assertEqual(self.pick(),0)
 def test_automatic_scoring_correction_and_tie(self):
  self.db.executemany('INSERT INTO picks VALUES(?,?,?,?)',[('l','a','past','KC'),('l','b','past','BUF')])
  scores=lambda:[dict(r) for r in self.db.execute(score_sql,(1,1,4,'l')).fetchall()]
  self.assertEqual([r['weekly'] for r in scores()],[1,0])
  self.db.execute("UPDATE games SET winner='BUF' WHERE id='past'")
  self.db.execute("INSERT INTO results VALUES('l','past','KC','final')")
  self.assertEqual([r['season'] for r in scores()],[0,1])
  self.db.execute("UPDATE games SET winner=NULL WHERE id='past'")
  self.assertEqual([r['season'] for r in scores()],[0,0])
 def test_saved_result_is_fallback_until_live_result_arrives(self):
  self.db.execute("INSERT INTO picks VALUES('l','a','locked','KC')")
  self.db.execute("INSERT INTO results VALUES('l','locked','KC','final')")
  row=self.db.execute(score_sql,(2,1,4,'l')).fetchone()
  self.assertEqual(row['weekly'],1)
 def test_favorite_team_loss(self):
  self.db.execute("UPDATE profiles SET favorite_team='KC' WHERE id='a'")
  self.db.execute("INSERT INTO picks VALUES('l','a','past','KC')")
  self.db.execute("UPDATE games SET winner='BUF' WHERE id='past'")
  losses=self.db.execute(favorite_loss_sql,('l',)).fetchall()
  self.assertEqual([(row['user'],row['week']) for row in losses],[('a',1)])
 def test_missed_picks_after_kickoff(self):
  self.db.execute("INSERT INTO results VALUES('l','locked',NULL,'cancelled')")
  missed=self.db.execute(missed_pick_sql,('l',self.now)).fetchall()
  self.assertEqual([(row['user'],row['week']) for row in missed],[('a',1),('b',1)])
 def test_weekly_vs_season(self):
  self.db.execute("INSERT INTO picks VALUES('l','a','past','KC')")
  row=self.db.execute(score_sql,(2,1,4,'l')).fetchone()
  self.assertEqual(row['weekly'],0);self.assertEqual(row['monthly'],1);self.assertEqual(row['season'],1)
 def test_super_bowl_settings_defaults_and_update(self):
  settings=self.db.execute("SELECT super_bowl_lock_week,super_bowl_points FROM leagues WHERE id='l'").fetchone()
  self.assertEqual(tuple(settings),(5,0))
  self.db.execute("UPDATE leagues SET super_bowl_lock_week=2,super_bowl_points=7 WHERE id='l'")
  settings=self.db.execute("SELECT super_bowl_lock_week,super_bowl_points FROM leagues WHERE id='l'").fetchone()
  self.assertEqual(tuple(settings),(2,7))
 def test_outright_pick_replaces_division_selection(self):
  self.db.execute("INSERT INTO outright_picks VALUES('l','a','afc_west','KC')")
  self.db.execute("INSERT INTO outright_picks VALUES('l','a','afc_west','DEN') ON CONFLICT(league,user,category) DO UPDATE SET team=excluded.team")
  self.assertEqual(self.db.execute("SELECT team FROM outright_picks").fetchone()['team'],'DEN')
 def test_picks_reveal_at_kickoff_or_partial_snapshot(self):
  self.db.executemany('INSERT INTO picks VALUES(?,?,?,?)',[('l','a','past','KC'),('l','a','future','BUF')])
  automatic=[r['game'] for r in self.db.execute(reveal_sql,('l',1,self.now,'l',1,self.now)).fetchall()]
  self.assertEqual(automatic,['past'])
  self.db.execute("INSERT INTO published_pick_entries VALUES('l',2,'a','future','BUF')")
  manual_week_two={r['game'] for r in self.db.execute(reveal_sql,('l',2,self.now,'l',2,self.now)).fetchall()}
  self.assertEqual(manual_week_two,{'future'})
 def test_publication_requires_every_member_for_each_game(self):
  self.assertEqual(self.pick(),1)
  self.db.execute(publication_sql,(2,'l',2,'l',2,'l'))
  self.assertEqual(self.db.execute('SELECT COUNT(*) FROM published_pick_entries').fetchone()[0],0)
  self.assertEqual(self.pick(user='b',team='BUF'),1)
  self.db.execute(publication_sql,(2,'l',2,'l',2,'l'))
  self.assertEqual(self.db.execute('SELECT COUNT(*) FROM published_pick_entries').fetchone()[0],2)
 def test_four_week_month_boundaries(self):
  self.db.executemany('INSERT INTO games VALUES(?,?,?,?,?,?,?)',[('week4',4,'KC','BUF',self.now-200000,'final','KC'),('week5',5,'KC','BUF',self.now-300000,'final','KC')])
  self.db.executemany('INSERT INTO picks VALUES(?,?,?,?)',[('l','a','week4','KC'),('l','a','week5','KC')])
  month1=self.db.execute(score_sql,(4,1,4,'l')).fetchone()
  month2=self.db.execute(score_sql,(5,5,8,'l')).fetchone()
  self.assertEqual(month1['monthly'],1)
  self.assertEqual(month2['monthly'],1)
  self.assertEqual(month2['season'],2)
if __name__=='__main__':unittest.main()
