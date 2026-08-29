import CanvasMount from '@/components/vehicle/CanvasMount';
import SmoothScroll from '@/components/ui/SmoothScroll';
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
      <CanvasMount />

      {/*
        Everything inside #journey is anchored to the 3D scene: the scroll
        position within this element is the timeline the car moves along.
        Nine sections, nine keyframes.
      */}
      <main id="journey" className="relative">
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

      {/* Past the journey the canvas fades out and the page becomes solid. */}
      <Platform />
      <Cta />
    </>
  );
}
