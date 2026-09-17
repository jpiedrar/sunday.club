import PickApp from './pick-app';
import { currentNflWeek } from '../lib/current-week';
export default function Home() {
  return <PickApp initialWeek={currentNflWeek()} />;
}
