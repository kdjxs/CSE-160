class Camera{
    constructor(canvas){
        this.fov = 60.0;
this.eye = new Vector3([-10, 3, 10]);
this.at  = new Vector3([-10, 3, 0]);
        this.up = new Vector3([0, 1, 0]);
        this.speed = 0.1;
        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                    this.at.elements[0], this.at.elements[1], this.at.elements[2], 
                                    this.up.elements[0], this.up.elements[1], this.up.elements[2]
                                );
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(this.fov, canvas.width/canvas.height, 0.1, 1000);
    }
    moveForward(){
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(this.speed);
        this.eye.add(f);
        this.at.add(f);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                    this.at.elements[0], this.at.elements[1], this.at.elements[2], 
                                    this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }
    moveBackwards(){
        let b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        b.normalize();
        b.mul(this.speed);
        this.eye.add(b);
        this.at.add(b);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                    this.at.elements[0], this.at.elements[1], this.at.elements[2], 
                                    this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }
    moveLeft(){
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(this.speed);

        this.eye.add(s);
        this.at.add(s);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                    this.at.elements[0], this.at.elements[1], this.at.elements[2], 
                                    this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }
    moveRight(){
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(this.speed);

        this.eye.add(s);
        this.at.add(s);
    }
    panLeft(alpha){
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        f_prime.normalize();
        this.at.set(this.eye);
        this.at.add(f_prime);
    }
    panRight(alpha){
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        f_prime.normalize();
        this.at.set(this.eye);
        this.at.add(f_prime);
    }
    panUp(alpha) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        let right = Vector3.cross(f, this.up);
        right.normalize();
        let rot = new Matrix4();
        rot.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);
        let fp = rot.multiplyVector3(f);
        fp.normalize();
        this.at.set(this.eye);
        this.at.add(fp);
    }
 
    panDown(alpha) {
        this.panUp(-alpha);
    }
 
    // Mouse look — call with dx/dy pixel delta
    mouseLook(dx, dy) {
        if (dx !== 0) this.panLeft(dx * 0.15);
        if (dy !== 0) this.panUp(dy * 0.15);
    }
}