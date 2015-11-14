"""three.js/Cannon.js pool table definition
"""

from copy import deepcopy
import numpy as np

from three import *

IN2METER = 0.0254
FT2METER = IN2METER / 12

square = QuadBufferGeometry(vertices=[[-0.5, 0, -0.5], [-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5]],
                            uvs=[(0,1), (0,0), (1,0), (1,1)])

ball_colors = []
white  = 0xeeeeee; ball_colors.append(white)
yellow = 0xeeee00; ball_colors.append(yellow)
blue   = 0x0000ee; ball_colors.append(blue)
red    = 0xee0000; ball_colors.append(red)
purple = 0xee00ee; ball_colors.append(purple)
green  = 0x00ee00; ball_colors.append(green)
orange = 0xee7700; ball_colors.append(orange)
maroon = 0xee0077; ball_colors.append(maroon)
black  = 0x111111; ball_colors.append(black)


def pool_table(L_table=2.3368, W_table=None, H_table=0.74295,
               L_playable=None, W_playable=None,
               ball_diameter=2.25*IN2METER,
               W_cushion=2*IN2METER,
               H_cushion=None):
    if W_table is None:
        W_table = 0.5*L_table
    if L_playable is None:
        L_playable = L_table - 2*W_cushion
    if W_playable is None:
        W_playable = W_table - 2*W_cushion
    if H_cushion is None:
        H_cushion = 0.635 * ball_diameter

    poolTable = Object3D(name="poolTable")

    feltMaterial = MeshPhongMaterial(color=0x00aa00, shininess=5, shading=FlatShading)

    playableSurfaceGeom = BoxGeometry(W_playable, H_table, L_playable)
    playableSurfaceMesh = Mesh(geometry=playableSurfaceGeom,
                               material=feltMaterial,
                               position=[0, 0.5*H_table, 0],
                               receiveShadow=True,
                               userData={'cannonData': {'mass': 0,
                                                        'shapes': ['Box']}})
    poolTable.add(playableSurfaceMesh)

    cushionMaterial = MeshPhongMaterial(color=0x00aa00, shininess=5, shading=FlatShading)
    # centered as if it were BoxGeometry(W_playable, H_cushion, W_cushion):
    headCushionGeom = PrismBufferGeometry(vertices=[[-0.5*W_playable,                     0,         0.5*W_cushion],
                                                    [-0.5*W_playable,                     H_cushion, 0.5*W_cushion],
                                                    [-0.5*W_playable + np.sqrt(2)*W_cushion, H_cushion, -0.5*W_cushion],
                                                    [0.5*W_playable,                     0,         0.5*W_cushion],
                                                    [0.5*W_playable,                     H_cushion, 0.5*W_cushion],
                                                    [0.5*W_playable - np.sqrt(2)*W_cushion, H_cushion, -0.5*W_cushion]])
    ###
    headCushionMesh = Mesh(geometry=headCushionGeom,
                           material=cushionMaterial,
                           position=[0, H_table, 0.5*L_table - 0.5*W_cushion],
                           receiveShadow=True,
                           userData={'cannonData': {'mass': 0,
                                                    'shapes': ['Box']}})
    poolTable.add(headCushionMesh)
    ###
    footCushionMesh = Mesh(geometry=headCushionGeom,
                           material=cushionMaterial,
                           position=[0, H_table, -0.5*L_table + 0.5*W_cushion],
                           rotation=[0, np.pi, 0],
                           receiveShadow=True,
                           userData={'cannonData': {'mass': 0, 'shapes': ['Box']}})
    poolTable.add(footCushionMesh)
    ###
    leftHeadCushionGeom = Mesh(geometry=headCushionGeom,
                               material=cushionMaterial,
                               position=[-0.5*W_table + 0.5*W_cushion, H_table, 0.25*L_table],
                               rotation=[0, -np.pi/2, 0],
                               receiveShadow=True,
                               userData={'cannonData': {'mass': 0, 'shapes': ['Box']}})
    poolTable.add(leftHeadCushionGeom)
    ###
    leftFootCushionGeom = Mesh(geometry=headCushionGeom,
                               material=cushionMaterial,
                               position=[-0.5*W_table + 0.5*W_cushion, H_table, -0.25*L_table],
                               rotation=[0, -np.pi/2, 0],
                               receiveShadow=True,
                               userData={'cannonData': {'mass': 0, 'shapes': ['Box']}})
    poolTable.add(leftFootCushionGeom)
    ##
    rightHeadCushionGeom = Mesh(geometry=headCushionGeom,
                               material=cushionMaterial,
                               position=[0.5*W_table - 0.5*W_cushion, H_table, 0.25*L_table],
                               rotation=[0, np.pi/2, 0],
                               receiveShadow=True,
                               userData={'cannonData': {'mass': 0, 'shapes': ['Box']}})
    poolTable.add(rightHeadCushionGeom)
    ###
    rightFootCushionGeom = Mesh(geometry=headCushionGeom,
                                material=cushionMaterial,
                                position=[0.5*W_table - 0.5*W_cushion, H_table, -0.25*L_table],
                                rotation=[0, np.pi/2, 0],
                                receiveShadow=True,
                                userData={'cannonData': {'mass': 0, 'shapes': ['Box']}})
    poolTable.add(rightFootCushionGeom)

    # left_rail = Mesh(geometry=BoxGeometry(W_cushion, H_cushion, L_table),
    #                    material=feltMaterial,
    #                    position=[-(W_table / 2 + W_cushion / 2),
    #                              H_table + H_cushion / 2,
    #                              0],
    #                    receiveShadow=True,
    #                    userData={'cannonData': {'mass': 0,
    #                                             'shapes': ['Box']}})
    # scene.add(left_rail)
    # right_rail = Mesh(geometry=BoxGeometry(W_cushion, H_cushion, L_table),
    #                     material=feltMaterial,
    #                     position=[(W_table / 2 + W_cushion / 2),
    #                               H_table + H_cushion / 2,
    #                               0],
    #                     receiveShadow=True,
    #                     userData={'cannonData': {'mass': 0,
    #                                              'shapes': ['Box']}})
    # scene.add(right_rail)

    ball_radius = ball_diameter / 2

    # # pockets (shitty hacked in)
    # pocket_radius = 2.5 * ball_radius
    # pocket_height = 3 * pocket_radius
    # pocketGeom = CylinderGeometry(radiusTop=pocket_radius,
    #                               radiusBottom=pocket_radius,
    #                               height=0.001,
    #                               radialSegments=16)
    # y_mesh = H_table
    # pocketMesh = Mesh(geometry=pocketGeom,
    #                   material=MeshBasicMaterial(color=0x000000),
    #                   position=[0, y_mesh, 0])
    # # left center:
    # pocketMesh.position[0] = -W_table / 2
    # pocketMesh.position[2] = 0
    # poolTable.add(deepcopy(pocketMesh))
    # # right center:
    # pocketMesh.position[0] = W_table / 2
    # pocketMesh.position[2] = 0
    # poolTable.add(deepcopy(pocketMesh))
    # # head left:
    # pocketMesh.position[0] = -W_table / 2
    # pocketMesh.position[2] = -L_table / 2
    # poolTable.add(deepcopy(pocketMesh))
    # # head right:
    # pocketMesh.position[0] = W_table / 2
    # pocketMesh.position[2] = -L_table / 2
    # poolTable.add(deepcopy(pocketMesh))
    # # foot left:
    # pocketMesh.position[0] = -W_table / 2
    # pocketMesh.position[2] = L_table / 2
    # poolTable.add(deepcopy(pocketMesh))
    # # foot right:
    # pocketMesh.position[0] = W_table / 2
    # pocketMesh.position[2] = L_table / 2
    # poolTable.add(deepcopy(pocketMesh))

    return poolTable


def pool_hall():
    scene = Scene()
    # room:
    L_room, W_room = 10, 10
    floor = Mesh(name="floor", geometry=square,
                 material=MeshBasicMaterial(color=0xffffff,
                                            map=Texture(image=Image(url="images/deck.png"),
                                                        repeat=[4*L_room, 4*W_room], wrap=[RepeatWrapping, RepeatWrapping])),
                 position=[0, 0, 0],
                 scale=[L_room, 1, W_room],
                 userData={'cannonData': {'mass': 0,
                                          'shapes': ['Plane']}})
    scene.add(floor)
    scene.add(PointLight(color=0xaa8866, position=[4, 5, 2.5], intensity=0.8, distance=40))

    ball_diameter = 2.25 * IN2METER
    L_table = 2.3368
    W_table = L_table / 2
    H_table = 0.74295
    poolTable = pool_table(H_table=H_table, ball_diameter=ball_diameter)
    scene.add(poolTable)

    # balls:
    ball_radius = ball_diameter / 2
    sphere = SphereBufferGeometry(radius=ball_radius, widthSegments=16, heightSegments=12)
    ballData = {'cannonData': {'mass': 0.17, 'shapes': ['Sphere']}}
    num_balls = len(ball_colors)
    y_position = H_table + ball_radius + 0.001 # epsilon distance which the ball will fall from initial position
    z_positions = 0.8 * np.linspace(-L_table / 2, L_table / 2, num_balls - 1)
    x_positions = 0.5 * z_positions
    z_positions = [L_table / 4] + list(z_positions)
    x_positions = [0] + list(x_positions)
    for i, color in enumerate(ball_colors):
        ballMesh = Mesh(name="ball %d" % i,
                        geometry=sphere,
                        material=MeshPhongMaterial(color=color, shading=SmoothShading),
                        position=[x_positions[i], y_position, z_positions[i]],
                        castShadow=True,
                        userData=ballData)
        scene.add(ballMesh)

    return scene.export()