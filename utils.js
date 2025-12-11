// function initCallbacks() {
//     document.onkeydown = keydown;
//     document.onkeyup = keyup;
//     state.canvas.onmousedown = mousedown;
//     state.canvas.onmouseup = mouseup;
//     state.canvas.onmousemove = mousemove;
// }

function initGL() {
    state.gl.clearColor(0,0,0,1);
    state.gl.enable(state.gl.DEPTH_TEST);
    state.gl.useProgram(state.programs[state.program]);
}

export function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}