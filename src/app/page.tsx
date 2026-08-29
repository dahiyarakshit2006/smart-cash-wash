import SmoothScroll from '@/components/ui/SmoothScroll';
import VideoBackdrop from '@/components/ui/VideoBackdrop';
import { Nav } from '@/components/ui/Chrome';
import { Hero, Transition } from '@/components/sections/Opening';
import Arrival from '@/components/sections/Arrival';
import Subscription from '@/components/sections/Subscription';
import Water from '@/components/sections/Water';
import { Wash, Quality, Drying, Ready } from '@/components/sections/Process';
import Platform from '@/components/sections/Platform';
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
        <Water />
        <Wash />
        <Quality />
        <Drying />
        <Ready />
      </main>

      <Platform />
      <Cta />
    </>
  );
}
