import * as THREE from '/swarm/node_modules/three/build/three.module.js';

import { TWEEN } from '/swarm/node_modules/three/examples/jsm/libs/tween.module.min.js';
import { OrbitControls } from '/swarm/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from '/swarm/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/swarm/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '/swarm/node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '/swarm/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';//'/swarm/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GUI } from '/swarm/node_modules/three/examples/jsm/libs/lil-gui.module.min.js';


let camera, scene, renderer;
let controls;

const objects = [];
const targets = { sphere: [], doughnut:[], helix: [], doubleHelix:[], grid: [], slope1: [], slope2: [] };
const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const materials = {};
let   renderScene,bloomPass,bloomComposer,finalPass,finalComposer

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );
const params = {
  exposure: 1,
  bloomStrength: 5,
  bloomThreshold: 0,
  bloomRadius: 0,
  animatedPattern: false,
  scene: 'Scene with Glow'
};
init();
animate();

function init() {

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  document.getElementById( 'container' ).appendChild( renderer.domElement );
  // table

  //glows
  renderScene = new RenderPass( scene, camera );

  bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  bloomComposer = new EffectComposer( renderer );
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass( renderScene );
  bloomComposer.addPass( bloomPass );

  finalPass = new ShaderPass(
    new THREE.ShaderMaterial( {
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader: document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      defines: {}
    } ), 'baseTexture'
  );
  finalPass.needsSwap = true;

  finalComposer = new EffectComposer( renderer );
  finalComposer.addPass( renderScene );
  finalComposer.addPass( finalPass );


  // table
  const geometry = new THREE.IcosahedronGeometry( 20, 15 );

  for ( let i = 0; i < 100; i ++ ) {

    const color = new THREE.Color();
    color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );

    const material = new THREE.MeshBasicMaterial( { color: color } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = Math.random() * 4000 - 2000;
    sphere.position.y = Math.random() * 4000 - 2000;
    sphere.position.z = Math.random() * 4000 - 2000;
    sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
    sphere.scale.setScalar( Math.random() * Math.random() + 0.5 );

    sphere.layers.enable( BLOOM_SCENE );

    scene.add( sphere );

    objects.push( sphere );

  }

  // sphere

  const vector = new THREE.Vector3();

  for ( let i = 0, l = objects.length; i < l; i ++ ) {

    const phi = Math.acos( - 1 + ( 2 * i ) / l );
    const theta = Math.sqrt( l * Math.PI ) * phi;

    const object = new THREE.Object3D();

    object.position.setFromSphericalCoords( 800, phi, theta );

    vector.copy( object.position ).multiplyScalar( 2 );

    object.lookAt( vector );

    targets.sphere.push( object );

  }

  // doughnut
  var st = 20 // number of times we draw a ring
  var sl = 5 // number of subdivisions of the ring
  const innerR = 50 // inner radius
  const outerR = 300

   // ring radius (thick part of donut)
  var phi = 0.0
  var dp = (2*Math.PI) / sl
  // torus radius (whole donut shape)
  let theta = 0.0
  let dt = (2*Math.PI) / st

  let verticies = {}
  for (let stack = 0; stack<st; stack++){
    theta = dt * stack
    for (let slice = 0; slice<sl; slice++){
      phi = dp * slice
      const object = new THREE.Object3D();
      object.position.x = 2* Math.cos(theta) * (outerR + Math.cos(phi) * innerR)
      object.position.y = 2* Math.sin(theta) * (outerR + Math.cos(phi) * innerR)
      object.position.z = 2* Math.sin(phi) * innerR
      vector.x = object.position.x * 2;
      vector.y = object.position.y;
      vector.z = object.position.z * 2;
      vector.copy( object.position ).multiplyScalar( 2 );

      object.lookAt( vector );

      targets.doughnut.push( object );
    }

  }


  // helix

  for ( let i = 0, l = objects.length; i < l; i ++ ) {

    const theta = i * 0.175 + Math.PI;
    const y = - ( i * 8 ) + 450;

    const object = new THREE.Object3D();

    object.position.setFromCylindricalCoords( 900, theta, y );

    vector.x = object.position.x * 2;
    vector.y = object.position.y * 2;
    vector.z = object.position.z * 2;
    object.position.y = object.position.y*1.5
    object.lookAt( vector );

    targets.helix.push( object );

  }
  //doubleHelix
  for ( let i = 0, l = objects.length; i < l; i ++ ) {


    const theta = i * 0.175 + Math.PI;
    const theta_alt = i * 0.175;
    const y = - ( i * 16 ) + 900;

    const object = new THREE.Object3D();

    object.position.setFromCylindricalCoords( 400, theta, y );

    if (i%2==0){
      object.position.setFromCylindricalCoords( 400, theta, y );

    }
    else{
      object.position.setFromCylindricalCoords( 400, theta_alt, y );
    }
    object.position.x = object.position.x*1.5
    object.position.z = object.position.z*1.5
    object.position.y = object.position.y*0.75
    // vector.x = object.position.x*4
    // vector.y = object.position.y*4
    // vector.z = object.position.z *10;

    object.lookAt( vector );

    targets.doubleHelix.push( object );

  }
  // grid
  //console.log(objects.length);
  for ( let i = 0; i < objects.length; i ++ ) {

    const object = new THREE.Object3D();

    object.position.x = ( ( i % 4 ) * 400 ) - 800;
    object.position.y = ( - ( Math.floor( i / 4 ) % 4 ) * 400 ) + 800;
    object.position.z = ( Math.floor( i / 25 ) ) * 500 - 1000;

    targets.grid.push( object );

  }


  // slope1

  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    const row = Math.floor(i / 25); // Calculate the current row

    // Calculate x and z positions based on row and position in row
    object.position.x = (i % 25) * 50 - 600; // Adjust the multiplier to set the spacing between objects along x
    object.position.y = -row * 40 + 80; // Spacing between rows
    object.position.z = row * 100 - 200; // Spacing between rows along z

    targets.slope1.push(object);
  }


  // slope2
  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    const row = Math.floor(i / 4); // Calculate the current row
    const column = i % 4; // Calculate the current column

    // Calculate x and z positions based on column and row
    object.position.x = -row * 50 + 600; // Spacing between rows along y
    object.position.y = column * 40 - 80; // Spacing between columns along x
    object.position.z = -column * 100 + 100; // Spacing between rows along z

  targets.slope2.push(object);
}


  controls = new OrbitControls( camera, renderer.domElement );
  // controls.maxPolarAngle = Math.PI * 0.5;
  // controls.minDistance = 1;
  // controls.maxDistance = 100;
  controls.addEventListener( 'change', render );

  // const buttonTable = document.getElementById( 'table' );
  // buttonTable.addEventListener( 'click', function () {
  //
  //   transform( targets.table, 2000 );
  //
  // } );

  const gui = new GUI();
  //console.log(gui);
	const bloomFolder = gui.addFolder( 'bloom' );
  //console.log(bloomFolder.add( params, 'bloomRadius', 0.0, 1.0 ));
  //console.log(bloomFolder);
	bloomFolder.add( params, 'bloomThreshold', 0.0, 2.0 ).onChange( function ( value ) {

		bloomPass.threshold = Number( value );
		render();

	} );

	bloomFolder.add( params, 'bloomStrength', 0.0, 10 ).onChange( function ( value ) {

		bloomPass.strength = Number( value );
		render();

	} );
  //
	bloomFolder.add( params, 'bloomRadius', 0.0, 2.0 ).step( 0.01 ).onChange( function ( value ) {

		bloomPass.radius = Number( value );
		render();

	} );

  bloomFolder.add( params, 'animatedPattern', true, false).onChange( function ( value ) {

		//bloomPass.radius = Number( value );
    const checkboxContainer = document.querySelector('.controller.boolean');
    const checkbox = checkboxContainer.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
      controls.autoRotate = true
      const selected = document.querySelector('#menu .selected');
      transform( targets[selected.id], 1000 );

    }
    else{
      controls.autoRotate = false
      TWEEN.removeAll();
    }
      // const selected = document.querySelector('#menu .selected');
      // transform( targets[selected.id], 1000 );


    // if(selected.id == 'slope'){
    //   slopePattern(2000,value);
    // }
    // else{
    //   //console.log(targets[selected.id]);
    //   transform( targets[selected.id], 1000 );
    //   //animatePattern(2000,value);
    // }

	} );
  //
	const toneMappingFolder = gui.addFolder( 'tone mapping' );

	toneMappingFolder.add( params, 'exposure', 0.1, 1 ).onChange( function ( value ) {

		renderer.toneMappingExposure = Math.pow( value, 4.0 );
		render();

	} );

  const menuButtons = document.querySelectorAll('#menu button');
  const buttonSlope1 = document.getElementById( 'slope1' );
  buttonSlope1.addEventListener( 'click', function () {
    //console.log(TWEEN);

    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.slope1, 2000 );
  } );
  const buttonSlope2 = document.getElementById( 'slope2' );
  buttonSlope2.addEventListener( 'click', function () {
    //console.log(TWEEN);

    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.slope2, 2000 );
  } );

  const buttonSphere = document.getElementById( 'sphere' );
  buttonSphere.addEventListener( 'click', function () {
    //console.log(TWEEN);

    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.sphere, 2000 );
  } );

  const buttonDoughnut = document.getElementById( 'doughnut' );
  buttonDoughnut.addEventListener( 'click', function () {


    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.doughnut, 2000 );
  } );

  const buttonHelix = document.getElementById( 'helix' );
  buttonHelix.addEventListener( 'click', function () {


    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.helix, 2000 );

  } );

  const buttonDoubleHelix = document.getElementById( 'doubleHelix' );
  buttonDoubleHelix.addEventListener( 'click', function () {


    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.doubleHelix, 2000 );

  } );

  const buttonGrid = document.getElementById( 'grid' );
  buttonGrid.addEventListener( 'click', function () {


    menuButtons.forEach(button => {
      button.classList.remove('selected');
    });
    this.classList.add('selected');
    transform( targets.grid, 2000 );

  } );

  transform( targets.sphere, 2000 );
  buttonSphere.classList.add('selected');
  //

  window.addEventListener( 'resize', onWindowResize );

}


const FinalPosition = 500;

function lerp(a, b, t) {
  return a + t * (b - a);
}
function slopePattern(duration, run) {
  if (run) {
    controls.autoRotate = true
    TWEEN.removeAll();


    for (let i = 0; i < objects.length; i++) {
      const _object = objects[i]; // Define _object here

      // Define the path as a list of (x, y) coordinates
      const fowardPath = [
        { x: _object.position.x, y: _object.position.y+0, z: _object.position.z-0 },
        { x: _object.position.x, y: _object.position.y+0, z: _object.position.z-FinalPosition*0.02 },
        { x: _object.position.x, y: _object.position.y+FinalPosition*0.02, z: _object.position.z-FinalPosition*0.1 },
        { x: _object.position.x, y: _object.position.y+FinalPosition*0.1, z: _object.position.z-FinalPosition*1},
        { x: _object.position.x, y: _object.position.y+FinalPosition*1, z: _object.position.z-FinalPosition*1}
      ];
      const reversePath = [
        { x: _object.position.x, y: _object.position.y+FinalPosition*1, z: _object.position.z-FinalPosition*1 },
        { x: _object.position.x, y:  _object.position.y+FinalPosition*0.1, z: _object.position.z-FinalPosition*1 },
        { x: _object.position.x, y:  _object.position.y+FinalPosition*0.02, z: _object.position.z-FinalPosition*0.1 },
        { x: _object.position.x, y: _object.position.y+0, z: _object.position.z-FinalPosition*0.02},
        { x: _object.position.x, y: _object.position.y+0, z: _object.position.z-0}
      ];

      function updateObjectReversePosition(progress) {
       const step = Math.floor(progress * (reversePath.length - 1)); // Calculate the step based on progress
       const nextStep = Math.min(step + 1, reversePath.length - 1);
       const interpolatedProgress = (progress * (reversePath.length - 1)) - step;
       //console.log(step,nextStep,interpolatedProgress,path.length);
       _object.position.x = lerp(reversePath[step].x, reversePath[nextStep].x, interpolatedProgress);
       _object.position.y = lerp(reversePath[step].y, reversePath[nextStep].y, interpolatedProgress);
       _object.position.z = lerp(reversePath[step].z, reversePath[nextStep].z, interpolatedProgress);
     }

     function updateObjectForwardPosition(progress) {
      const step = Math.floor(progress * (fowardPath.length - 1)); // Calculate the step based on progress
      const nextStep = Math.min(step + 1, fowardPath.length - 1);
      const interpolatedProgress = (progress * (fowardPath.length - 1)) - step;
      //console.log(step,nextStep,interpolatedProgress,path.length);
      _object.position.x = lerp(fowardPath[step].x, fowardPath[nextStep].x, interpolatedProgress);
      _object.position.y = lerp(fowardPath[step].y, fowardPath[nextStep].y, interpolatedProgress);
      _object.position.z = lerp(fowardPath[step].z, fowardPath[nextStep].z, interpolatedProgress);
     }

      const forwardTween = new TWEEN.Tween({ progress: 0 })
        .to({ progress: 1 }, duration+(i*100) )
        .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(function () {
          //console.log(this,this._object,this.object,this.progress);
          updateObjectForwardPosition(this._object.progress); // Pass progress explicitly
        })
        .onComplete(() => {
          reverseTween.start();
        })

        const reverseTween = new TWEEN.Tween({ progress: 0 })
          .to({ progress: 1 }, duration+(i*100) )
          .easing(TWEEN.Easing.Exponential.InOut)
          .onUpdate(function () {
            //console.log(this,this._object,this.object,this.progress);
            updateObjectReversePosition(this._object.progress); // Pass progress explicitly
          })
          // .onComplete(() => {
          //   forwardTween.start();
          // })
      //tween._object = _object; // Add this line to attach the object
      forwardTween.start();
    }

    new TWEEN.Tween(this)
      .to({}, (duration+(objects.length*100))*2)
      .onUpdate(render)
      .onComplete(() => {
        slopePattern(duration, true);
      })
      .start();
  } else {
    TWEEN.removeAll();
    controls.autoRotate = false;
  }
}








//DON NOT DELETE
function animatePattern(duration, run) {
  if (run) {
    TWEEN.removeAll();
    controls.autoRotate = true
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];

      const startPosition = {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      };

      const targetPosition = {
        x: object.position.x / 10,
        y: object.position.y / 10,
        z: object.position.z / 10
      };

      const forwardTween = new TWEEN.Tween(object.position)
        .to(targetPosition, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .onComplete(() => {
          reverseTween.start();
        });

      const reverseTween = new TWEEN.Tween(object.position)
        .to(startPosition, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .onComplete(() => {
          forwardTween.start();
        });

      forwardTween.start();
    }

    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .onUpdate(render)
      .onComplete(() => {
        animatePattern(duration, true);
      })
      .start();
  } else {
    TWEEN.removeAll();
    controls.autoRotate = false
  }
}


function transform( targets, duration ) {

  TWEEN.removeAll();

  for ( let i = 0; i < objects.length; i ++ ) {

    const object = objects[ i ];
    const target = targets[ i ];

    // console.log(object);
    // console.log(targets);

    new TWEEN.Tween( object.position )
      .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
      .easing( TWEEN.Easing.Exponential.InOut )
      .start();

    new TWEEN.Tween( object.rotation )
      .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
      .easing( TWEEN.Easing.Exponential.InOut )
      .start();

  }

  const checkboxContainer = document.querySelector('.controller.boolean');
  const checkbox = checkboxContainer.querySelector('input[type="checkbox"]');
  if (checkbox.checked) {
    //console.log('Checkbox is checked');
    const selected = document.querySelector('#menu .selected');
    //console.log(selected);
    if(selected.id == 'slope1'||selected.id == 'slope2'){
      new TWEEN.Tween( this )
        .to( {}, duration * 2 )
        .onUpdate( render )
        .onComplete(() => {
          slopePattern(2000, true);
        })
        .start();

    }
    else{
      new TWEEN.Tween( this )
        .to( {}, duration * 2 )
        .onUpdate( render )
        .onComplete(() => {
          animatePattern(2000, true);
        })
        .start();

    }
  } else {

    new TWEEN.Tween( this )
      .to( {}, duration * 2 )
      .onUpdate( render )
      .start();
  }

  new TWEEN.Tween( this )
    .to( {}, duration * 2 )
    .onUpdate( render )
    .start();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  render();

}

function animate() {

  requestAnimationFrame( animate );

  TWEEN.update();

  controls.update();

}

function render() {

  switch ( params.scene ) {

    case 'Scene only':
      renderer.render( scene, camera );
      break;
    case 'Glow only':
      renderBloom( false );
      break;
    case 'Scene with Glow':
    default:
      // render scene with bloom
      renderBloom( true );

      // render the entire scene, then render bloom scene on top
      finalComposer.render();
      break;

  }

}



/*=========================Helper=====================*/
function renderBloom( mask ) {

  if ( mask === true ) {

    scene.traverse( darkenNonBloomed );
    bloomComposer.render();
    scene.traverse( restoreMaterial );

  } else {

    camera.layers.set( BLOOM_SCENE );
    bloomComposer.render();
    camera.layers.set( ENTIRE_SCENE );

  }

}

function darkenNonBloomed( obj ) {

  if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

    materials[ obj.uuid ] = obj.material;
    obj.material = darkMaterial;

  }

}

function restoreMaterial( obj ) {

  if ( materials[ obj.uuid ] ) {

    obj.material = materials[ obj.uuid ];
    delete materials[ obj.uuid ];

  }

}
