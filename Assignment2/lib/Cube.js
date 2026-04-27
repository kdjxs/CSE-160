class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        let rgba = this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // top
        gl.uniform4f(u_FragColor, rgba[0] * 1.0, rgba[1] * 1.0, rgba[2] * 1.0, rgba[3]);
        drawTriangle3D([0,1,0,  0,1,1,  1,1,1]);
        drawTriangle3D([0,1,0,  1,1,1,  1,1,0]);

        // bottom
        gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3D([0,0,0,  1,0,1,  0,0,1]);
        drawTriangle3D([0,0,0,  1,0,0,  1,0,1]);

        // front
        gl.uniform4f(u_FragColor, rgba[0] * 0.85, rgba[1] * 0.85, rgba[2] * 0.85, rgba[3]);
        drawTriangle3D([0,0,0,  1,1,0,  0,1,0]);
        drawTriangle3D([0,0,0,  1,0,0,  1,1,0]);

        // back
        gl.uniform4f(u_FragColor, rgba[0] * 0.85, rgba[1] * 0.85, rgba[2] * 0.85, rgba[3]);
        drawTriangle3D([0,0,1,  0,1,1,  1,1,1]);
        drawTriangle3D([0,0,1,  1,1,1,  1,0,1]);

        // left
        gl.uniform4f(u_FragColor, rgba[0] * 0.75, rgba[1] * 0.75, rgba[2] * 0.75, rgba[3]);
        drawTriangle3D([0,0,0,  0,1,1,  0,0,1]);
        drawTriangle3D([0,0,0,  0,1,0,  0,1,1]);

        // right
        gl.uniform4f(u_FragColor, rgba[0] * 0.75, rgba[1] * 0.75, rgba[2] * 0.75, rgba[3]);
        drawTriangle3D([1,0,0,  1,0,1,  1,1,1]);
        drawTriangle3D([1,0,0,  1,1,1,  1,1,0]);
    }
}
