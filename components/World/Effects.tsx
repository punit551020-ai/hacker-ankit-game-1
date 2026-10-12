/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      {/* High-quality radiant bloom with vivid glow for neon lasers, gems, and character thrusters */}
      <Bloom 
        luminanceThreshold={0.65} 
        mipmapBlur 
        intensity={1.15} 
        radius={0.55}
        levels={7}
      />
      {/* Subtle vignette that keeps the screen bright, clear, and open */}
      <Vignette eskil={false} offset={0.2} darkness={0.18} />
    </EffectComposer>
  );
};
