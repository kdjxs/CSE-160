// Darren Fang
// dfang10@ucsc.edu

let canvas;
let ctx;

// DrawRectangle.js
function main() {
    canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    ctx = canvas.getContext('2d');

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 400);
    var v1 = new Vector3([2.25, 2.25, 0]);
    drawVector(v1, "red");
}
function drawVector(v, color){
    let x = v.elements[0] * 20;
    let y = v.elements[1] * 20;

    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200 + x, 200 - y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function handleDrawEvent(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let x = Number(document.getElementById("v1x").value);
    let y = Number(document.getElementById("v1y").value);
    let v1 = new Vector3([x, y, 0]);
    let x2 = Number(document.getElementById("v2x").value);
    let y2 = Number(document.getElementById("v2y").value);
    let v2 = new Vector3([x2, y2, 0]);
    drawVector(v1, "red");
    drawVector(v2, "blue");
}

function handleDrawOperationEvent(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let x = Number(document.getElementById("v1x").value);
    let y = Number(document.getElementById("v1y").value);
    let v1 = new Vector3([x, y, 0]);
    let x2 = Number(document.getElementById("v2x").value);
    let y2 = Number(document.getElementById("v2y").value);
    let v2 = new Vector3([x2, y2, 0]);
    drawVector(v1, "red");
    drawVector(v2, "blue");
    let choice;
    let choice2;
    let scalar = Number(document.getElementById("sca").value);
    if (document.getElementById("op-select").value === "add"){
        choice = v1.add(v2);
    }
    else if (document.getElementById("op-select").value === "sub"){
        choice = v1.sub(v2);
    }
    else if (document.getElementById("op-select").value === "mul"){
        choice = v1.mul(scalar);
        choice2 = v2.mul(scalar);
        drawVector(choice, "green");
        drawVector(choice2, "green");
    }
    else if (document.getElementById("op-select").value === "div"){
        choice = v1.div(scalar);
        choice2 = v2.div(scalar);
        drawVector(choice, "green");
        drawVector(choice2, "green");
    }
    else if (document.getElementById("op-select").value === "mag"){
        console.log("v1 magnitude:", v1.magnitude());
        console.log("v2 magnitude:", v2.magnitude());
    }
    else if (document.getElementById("op-select").value === "nor"){
        choice = v1.normalize();
        choice2 = v2.normalize();
        drawVector(choice, "green");
        drawVector(choice2, "green");
    }
    else if (document.getElementById("op-select").value === "ang"){
        angleBetween(v1, v2);
    }
    else if (document.getElementById("op-select").value === "are"){
        areaTriangle(v1, v2);
    }
}

function angleBetween(v1, v2){
    let dot = Vector3.dot(v1, v2);
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
    let cosAlpha = dot / (mag1 * mag2);
    let angleRad = Math.acos(cosAlpha);
    let angleDeg = angleRad * 180 / Math.PI;
    console.log("Angle:", angleDeg);
}
function areaTriangle(v1, v2){
    let area = Vector3.cross(v1, v2);
    let areaP = area.magnitude();
    let areaT = areaP / 2;
    console.log("Area of triangle:", areaT);
}