class Model {
    constructor() {
        this.type = 'model';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -3;
        this.vertices = new Float32Array([]);
        this.normals  = new Float32Array([]);
        this.isLoaded = false;
    }

    loadFromURL(url) {
        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch ' + url);
                return r.text();
            })
            .then(text => {
                this.parseOBJ(text);
                console.log('Model loaded:', this.vertices.length/3, 'vertices');
            })
            .catch(e => console.error('Model load error:', e));
    }

    parseOBJ(text) {
        const allVerts   = [];
        const allNormals = [];
        const outVerts   = [];
        const outNormals = [];

        const lines = text.split('\n');
        for (let line of lines) {
            // normalize whitespace
            const parts = line.trim().split(/\s+/);
            if (parts[0] === 'v') {
                allVerts.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
            } else if (parts[0] === 'vn') {
                allNormals.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
            } else if (parts[0] === 'f') {
                const faceVerts = parts.slice(1);
                // triangulate as fan
                for (let i = 1; i < faceVerts.length - 1; i++) {
                    for (let fv of [faceVerts[0], faceVerts[i], faceVerts[i+1]]) {
                        const s = fv.split('//');
                        const vi = (parseInt(s[0]) - 1) * 3;
                        const ni = (parseInt(s[1]) - 1) * 3;
                        outVerts.push(
                            allVerts[vi],
                            allVerts[vi+1],
                            allVerts[vi+2]
                        );
                        outNormals.push(
                            allNormals[ni],
                            allNormals[ni+1],
                            allNormals[ni+2]
                        );
                    }
                }
            }
        }
        this.vertices = new Float32Array(outVerts);
        this.normals  = new Float32Array(outNormals);
        this.isLoaded = true;
    }

    render() {
        if (!this.isLoaded) return;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var normalMat = new Matrix4();
        normalMat.setInverseOf(this.matrix);
        normalMat.transpose();
        gl.uniformMatrix4fv(u_normalMatrix, false, normalMat.elements);

        // position buffer
        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // normal buffer
        var nBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.disableVertexAttribArray(a_UV);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

        // re-enable UV for subsequent draws
        gl.enableVertexAttribArray(a_UV);
    }
}