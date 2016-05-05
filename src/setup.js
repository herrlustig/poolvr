// TODO: load from JSON config
POOLVR.ballMaterial            = new CANNON.Material();
POOLVR.ballBallContactMaterial = new CANNON.ContactMaterial(POOLVR.ballMaterial, POOLVR.ballMaterial, {
    restitution: 0.92,
    friction: 0.14
});
POOLVR.playableSurfaceMaterial            = new CANNON.Material();
POOLVR.ballPlayableSurfaceContactMaterial = new CANNON.ContactMaterial(POOLVR.ballMaterial, POOLVR.playableSurfaceMaterial, {
    restitution: 0.3,
    friction: 0.21
});
POOLVR.cushionMaterial            = new CANNON.Material();
POOLVR.ballCushionContactMaterial = new CANNON.ContactMaterial(POOLVR.ballMaterial, POOLVR.cushionMaterial, {
    restitution: 0.8,
    friction: 0.12
});
POOLVR.floorMaterial            = new CANNON.Material();
POOLVR.floorBallContactMaterial = new CANNON.ContactMaterial(POOLVR.floorMaterial, POOLVR.ballMaterial, {
    restitution: 0.86,
    friction: 0.4
});
POOLVR.railMaterial            = new CANNON.Material();
POOLVR.railBallContactMaterial = new CANNON.ContactMaterial(POOLVR.railMaterial, POOLVR.ballMaterial, {
    restitution: 0.7,
    friction: 0.07
});
POOLVR.tipMaterial            = new CANNON.Material();
POOLVR.tipBallContactMaterial = new CANNON.ContactMaterial(POOLVR.tipMaterial, POOLVR.ballMaterial, {
    restitution: 0.01,
    friction: 0.15,
    contactEquationRelaxation: 2,
    frictionEquationRelaxation: 2
});


POOLVR.ballMeshes = [];
POOLVR.ballBodies = [];
POOLVR.initialPositions = [];
POOLVR.onTable = [true,
                  true, true, true, true, true, true, true,
                  true,
                  true, true, true, true, true, true, true];
POOLVR.nextBall = 1;


POOLVR.playCollisionSound = (function () {
    "use strict";
    var ballBallBuffer;
    var request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';
    request.open('GET', 'sounds/ballBall.ogg');
    request.onload = function() {
        WebVRSound.audioContext.decodeAudioData(this.response, function(buffer) {
            ballBallBuffer = buffer;
        });
    };
    request.send();
    var playCollisionSound = function (v) {
        WebVRSound.playBuffer(ballBallBuffer, Math.min(1, v / 10));
    };
    return playCollisionSound;
})();


POOLVR.playPocketedSound = (function () {
    "use strict";
    var ballPocketedBuffer;
    var request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';
    request.open('GET', 'sounds/ballPocketed.ogg');
    request.onload = function() {
        WebVRSound.audioContext.decodeAudioData(this.response, function(buffer) {
            ballPocketedBuffer = buffer;
        });
    };
    request.send();
    var playPocketedSound = function () {
        WebVRSound.playBuffer(ballPocketedBuffer, 0.5);
    };
    return playPocketedSound;
})();


POOLVR.setup = function () {
    "use strict";
    var world = new CANNON.World();
    world.gravity.set( 0, -POOLVR.config.gravity, 0 );
    //world.broadphase = new CANNON.SAPBroadphase( world );
    world.defaultContactMaterial.contactEquationStiffness   = 1e7;
    world.defaultContactMaterial.frictionEquationStiffness  = 2e6;
    world.defaultContactMaterial.contactEquationRelaxation  = 2;
    world.defaultContactMaterial.frictionEquationRelaxation = 3;
    world.solver.iterations = 9;

    POOLVR.world = world;

    var scene = POOLVR.app.scene;

    THREE.py.CANNONize(scene, world);

    world.addMaterial(POOLVR.ballMaterial);
    world.addMaterial(POOLVR.playableSurfaceMaterial);
    world.addMaterial(POOLVR.cushionMaterial);
    world.addMaterial(POOLVR.floorMaterial);
    world.addMaterial(POOLVR.tipMaterial);
    world.addMaterial(POOLVR.railMaterial);
    world.addContactMaterial(POOLVR.ballBallContactMaterial);
    world.addContactMaterial(POOLVR.ballPlayableSurfaceContactMaterial);
    world.addContactMaterial(POOLVR.ballCushionContactMaterial);
    world.addContactMaterial(POOLVR.floorBallContactMaterial);
    world.addContactMaterial(POOLVR.tipBallContactMaterial);
    world.addContactMaterial(POOLVR.railBallContactMaterial);

    var useShadowMap = POOLVR.config.useShadowMap;

    POOLVR.shadowMaterial = new THREE.MeshBasicMaterial({color: 0x002200});

    POOLVR.leapIndicator = document.getElementById('leapIndicator');

    var leapTool = YAWVRB.LeapMotion.makeTool( combineObjects(POOLVR.config.toolOptions, {
        onConnect: function () {
            POOLVR.leapIndicator.innerHTML = 'Leap Motion: connected';
            POOLVR.leapIndicator.style['background-color'] = 'rgba(20, 160, 20, 0.8)';
        },
        onDisconnect: function () {
            POOLVR.leapIndicator.innerHTML = 'Leap Motion: disconnected';
            POOLVR.leapIndicator.style['background-color'] = 'rgba(60, 20, 20, 0.4)';
        },
        shadowMaterial: POOLVR.shadowMaterial,
        shadowPlane: 1.01 * POOLVR.config.H_table
    }) );

    POOLVR.leapTool           = leapTool;
    POOLVR.leapController     = leapTool.leapController;
    POOLVR.toolRoot           = leapTool.toolRoot;
    POOLVR.toolMesh           = leapTool.toolMesh;
    POOLVR.toolBody           = leapTool.toolBody;
    POOLVR.updateTool         = leapTool.updateTool;
    POOLVR.updateToolPostStep = leapTool.updateToolPostStep;
    POOLVR.updateToolMapping  = leapTool.updateToolMapping;

    world.addBody(leapTool.toolBody);
    POOLVR.avatar.add(leapTool.toolRoot);

    if (!useShadowMap) {
        POOLVR.app.scene.add(POOLVR.leapTool.toolShadowMesh);
    }

    POOLVR.leapController.connect();
    POOLVR.updateToolMapping();

    POOLVR.objectSelector.addSelectable(POOLVR.toolRoot);

    var basicMaterials = {};
    var nonbasicMaterials = {};

    POOLVR.switchMaterials = function (useBasicMaterials) {
        var materials = useBasicMaterials ? basicMaterials : nonbasicMaterials;
        POOLVR.app.scene.traverse( function (node) {
            if (node instanceof THREE.Mesh) {
                var material = node.material;
                var name = material.name;
                if (materials[name]) {
                    node.material = materials[name];
                }
            }
        } );
    };

    var floorBody;

    scene.traverse(function (node) {

        if (node instanceof THREE.Mesh) {

            if ( node.material.name && (nonbasicMaterials[node.material.name] === undefined) &&
                (node.material instanceof THREE.MeshLambertMaterial || node.material instanceof THREE.MeshPhongMaterial) ) {
                nonbasicMaterials[node.material.name] = node.material;
                var basicMaterial = new THREE.MeshBasicMaterial({color: node.material.color.getHex(), transparent: node.material.transparent, side: node.material.side});
                basicMaterial.name = node.material.name;
                basicMaterials[node.material.name] = basicMaterial;
            }

            var ballNum;
            if (node.name.startsWith('ballMesh')) {
                ballNum = Number(node.name.split(' ')[1]);
                POOLVR.ballMeshes[ballNum] = node;
                POOLVR.ballBodies[ballNum] = node.body;
                POOLVR.initialPositions[ballNum] = new THREE.Vector3().copy(node.position);
                node.body.bounces = 0;
                node.body.ballNum = ballNum;
                node.body.material = POOLVR.ballMaterial;
            }
            else if (node.name === 'playableSurfaceMesh') {
                node.body.material = POOLVR.playableSurfaceMaterial;
            }
            else if (node.name.endsWith('CushionMesh')) {
                node.body.material = POOLVR.cushionMaterial;
            }
            else if (node.name === 'floorMesh') {
                floorBody = node.body;
                floorBody.material = POOLVR.floorMaterial;
            }
            else if (node.name.endsWith('RailMesh')) {
                node.body.material = POOLVR.railMaterial;
            }

        }

    });

    var H_table = POOLVR.config.H_table;

    if (!useShadowMap) {

        var ballShadowMeshes = [];
        var ballShadowGeom = new THREE.CircleBufferGeometry(0.5*POOLVR.config.ball_diameter, 16);
        ballShadowGeom.rotateX(-0.5*Math.PI);

        POOLVR.ballMeshes.forEach( function (mesh, ballNum) {
            var ballShadowMesh = new THREE.Mesh(ballShadowGeom, POOLVR.shadowMaterial);
            ballShadowMesh.position.copy(mesh.position);
            ballShadowMesh.position.y = H_table + 0.0004;
            ballShadowMeshes[ballNum] = ballShadowMesh;
            scene.add(ballShadowMesh);
        } );

    }

    POOLVR.updateBallsPostStep = function () {

        for (var i = 0; i < POOLVR.ballMeshes.length; i++) {

            var mesh = POOLVR.ballMeshes[i];
            var body = POOLVR.ballBodies[i];
            mesh.position.copy(body.interpolatedPosition);
            mesh.quaternion.copy(body.interpolatedQuaternion);
            mesh.updateMatrix();
            mesh.updateMatrixWorld();

            if (!useShadowMap) {
                var shadowMesh = ballShadowMeshes[i];
                shadowMesh.position.x = mesh.position.x;
                shadowMesh.position.z = mesh.position.z;
                shadowMesh.updateMatrix();
                shadowMesh.updateMatrixWorld();
            }

        }

    };

    // ball-floor collision
    floorBody.addEventListener(CANNON.Body.COLLIDE_EVENT_NAME, function (evt) {

        var body = evt.body;

        if (body.ballNum === 0) {

            POOLVR.textGeomLogger.log("SCRATCH.");
            POOLVR.synthSpeaker.speak("Scratch.");
            body.position.copy(POOLVR.initialPositions[0]);
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);

        } else if (body.ballNum !== undefined) {

            body.bounces++;
            if (body.bounces === 1) {
                // POOLVR.textGeomLogger.log(body.mesh.name + " HIT THE FLOOR!");
                POOLVR.playPocketedSound();
                POOLVR.onTable[body.ballNum] = false;
                POOLVR.nextBall = POOLVR.onTable.slice(1).indexOf(true) + 1;
                if (POOLVR.nextBall === 0) {
                    POOLVR.synthSpeaker.speak("You cleared the table.  Well done.");
                    POOLVR.textGeomLogger.log("YOU CLEARED THE TABLE.  WELL DONE.");
                    POOLVR.resetTable();
                }
            } else if (body.bounces === 7) {
                body.sleep();
                body.mesh.visible = false;
            }

        }

    });

    var relVelocity = new CANNON.Vec3();
    world.addEventListener('beginContact', function (evt) {
        var bodyA = evt.bodyA;
        var bodyB = evt.bodyB;
        if (bodyA.material === bodyB.material) {
            // ball-ball collision
            bodyA.velocity.vsub(bodyB.velocity, relVelocity);
            POOLVR.playCollisionSound(relVelocity.lengthSquared());
        }
    });

};
