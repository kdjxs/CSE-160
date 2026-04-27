// Sphere code was created using Microsoft Copilot

class Sphere{
    constructor(){
		this.type = 'sphere';
		this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 6;
    }
    render(){
        gl.uniform4f(u_FragColor,
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3]
        );
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let latCount = this.segments;
        let lonCount = this.segments;

        for (let lat = 0; lat < latCount; lat++) {
            let theta0 = Math.PI * (lat / latCount);
            let theta1 = Math.PI * ((lat + 1) / latCount);

            for (let lon = 0; lon < lonCount; lon++) {
                let phi0 = 2 * Math.PI * (lon / lonCount);
                let phi1 = 2 * Math.PI * ((lon + 1) / lonCount);

                // 4 points of the quad
                let p0 = this.point(theta0, phi0);
                let p1 = this.point(theta1, phi0);
                let p2 = this.point(theta1, phi1);
                let p3 = this.point(theta0, phi1);

                // two triangles
                drawTriangle3D([...p0, ...p1, ...p2]);
                drawTriangle3D([...p0, ...p2, ...p3]);
            }
        }
    }

    point(theta, phi) {
        let x = Math.sin(theta) * Math.cos(phi);
        let y = Math.cos(theta);
        let z = Math.sin(theta) * Math.sin(phi);
        return [x, y, z];
    }
}