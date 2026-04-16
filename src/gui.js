import GUI from 'lil-gui';
import { RefreshStarBackground } from './scene';
import { speedLineUniforms } from './speedLines';

export const params = {
    starCount: 50000,
};
export function AddGui() {
    const gui = new GUI();

    gui.add(params, 'starCount', 10, 50000, 1)
        .name('Star Count')
        .onChange((value) => {
            RefreshStarBackground(value);
        });

    const speedFolder = gui.addFolder('Speed Lines');

    speedFolder.add(speedLineUniforms.radialScale, 'value', 0, 20, 0.1).name('Radial Scale');
    speedFolder.add(speedLineUniforms.lengthScale, 'value', 0, 500, 1).name('Length Scale');
    speedFolder.add(speedLineUniforms.speedLineAnimation, 'value', 0, 100, 0.1).name('Animation Speed');
    speedFolder.add(speedLineUniforms.speedLinePower, 'value', 0, 10, 0.1).name('Animation power');

    speedFolder.add(speedLineUniforms.maskScale, 'value', 0, 10, 0.1).name('Mask Scale');
    speedFolder.add(speedLineUniforms.maskHardness, 'value', 0, 5, 0.1).name('Mask Hardness');
    speedFolder.add(speedLineUniforms.maskPower, 'value', 0, 10, 0.1).name('Mask Power');

    speedFolder.add(speedLineUniforms.speedLineMap, 'value', 0, 1, 0.01).name('Map Strength');



    return gui;
}