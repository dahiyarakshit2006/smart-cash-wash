import SmoothScroll from '@/components/ui/SmoothScroll';
import VideoBackdrop from '@/components/ui/VideoBackdrop';
import { Nav } from '@/components/ui/Chrome';
import { Hero, Transition } from '@/components/sections/Opening';
import Arrival from '@/components/sections/Arrival';
import Subscription from '@/components/sections/Subscription';
import { Wash, Quality, Ready } from '@/components/sections/Process';
import Cta from '@/components/sections/Cta';

export default function Page() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <VideoBackdrop />

      <main className="relative">
        <Hero />
        <Transition />
        <Arrival />
        <Subscription />
        <Wash />
        <Quality />
        <Ready />
      </main>

      <Cta />
    </>
  );
}
