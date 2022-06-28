var Opcodes=Java.type('org.objectweb.asm.Opcodes')
var InsnList=Java.type('org.objectweb.asm.tree.InsnList')
var VarInsnNode=Java.type('org.objectweb.asm.tree.VarInsnNode')
var MethodInsnNode=Java.type('org.objectweb.asm.tree.MethodInsnNode')
var MethodNode=Java.type('org.objectweb.asm.tree.MethodNode')
var InsnNode=Java.type('org.objectweb.asm.tree.InsnNode')
var FieldInsnNode=Java.type('org.objectweb.asm.tree.FieldInsnNode')
var LabelNode=Java.type('org.objectweb.asm.tree.LabelNode')
var LocalVariableNode=Java.type('org.objectweb.asm.tree.LocalVariableNode')
var Label=Java.type('org.objectweb.asm.Label')
var JumpInsnNode=Java.type('org.objectweb.asm.tree.JumpInsnNode')
var FieldNode=Java.type('org.objectweb.asm.tree.FieldNode')

function clientPacketRedirectTransformCustom(methodNode, methodInsnNode, localVariable){
	var instructions = methodNode.instructions
	var patchList = new InsnList()
	patchList.add(new VarInsnNode(Opcodes.ALOAD, localVariable))
	//INVOKESTATIC xaero/common/core/LaunchPlugin.chunkUpdateCallback (Lnet/minecraft/client/renderer/chunk/ChunkRenderDispatcher$ChunkRender;)V
	patchList.add(methodInsnNode)
	for(var i = 0; i < instructions.size(); i++) {
		var insn = instructions.get(i);
		if(insn.getOpcode() == Opcodes.INVOKESTATIC) {
			if(insn.owner.equals("net/minecraft/network/PacketThreadUtil") && (insn.name.equals("ensureRunningOnSameThread") || insn.name.equals("func_218797_a"))) {
				instructions.insert(insn, patchList);
				break;
			}
		}
	}
}

function clientPacketRedirectTransform(methodNode, methodInsnNode){
	clientPacketRedirectTransformCustom(methodNode, methodInsnNode, 1)
}

function addCustomGetter(classNode, fieldName, fieldDesc, methodName){
	var methods = classNode.methods
	var getterNode = new MethodNode(Opcodes.ACC_PUBLIC, methodName, "()" + fieldDesc, null, null)
	var labelNode1 = new LabelNode()
	var labelNode2 = new LabelNode()
	var instructions = getterNode.instructions
	instructions.add(labelNode1)
	instructions.add(new VarInsnNode(Opcodes.ALOAD, 0))
	instructions.add(new FieldInsnNode(Opcodes.GETFIELD, classNode.name, fieldName, fieldDesc))
	instructions.add(new InsnNode(Opcodes.ARETURN))
	instructions.add(labelNode2)
	getterNode.localVariables.add(new LocalVariableNode("this", "L" + classNode.name + ";", null, labelNode1, labelNode2, 0))
	getterNode.maxStack = 1
	getterNode.maxLocals = 1
	methods.add(getterNode)
}

function addGetter(classNode, fieldName, fieldDesc){
	addCustomGetter(classNode, fieldName, fieldDesc, "get" + (fieldName.charAt(0) + "").toUpperCase() + fieldName.substring(1))
}

function addSetter(classNode, fieldName, fieldDesc){
	var methods = classNode.methods
	var setterNode = new MethodNode(Opcodes.ACC_PUBLIC, "set" + (fieldName.charAt(0) + "").toUpperCase() + fieldName.substring(1), "(" + fieldDesc +  ")V", null, null)
	var labelNode1 = new LabelNode()
	var labelNode2 = new LabelNode()
	var instructions = setterNode.instructions
	instructions.add(labelNode1)
	instructions.add(new VarInsnNode(Opcodes.ALOAD, 0))
	instructions.add(new VarInsnNode(Opcodes.ALOAD, 1))
	instructions.add(new FieldInsnNode(Opcodes.PUTFIELD, classNode.name, fieldName, fieldDesc))
	instructions.add(new InsnNode(Opcodes.RETURN))
	instructions.add(labelNode2)
	setterNode.localVariables.add(new LocalVariableNode("this", "L" + classNode.name + ";", null, labelNode1, labelNode2, 0))
	setterNode.localVariables.add(new LocalVariableNode("value", fieldDesc, null, labelNode1, labelNode2, 1))
	setterNode.maxStack = 2
	setterNode.maxLocals = 2
	methods.add(setterNode)
}

function modelRenderDetectionTransform(methodNode){
	var instructions = methodNode.instructions
	var patchList = new InsnList()
	patchList.add(new VarInsnNode(Opcodes.ALOAD, 0))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 5))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 6))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 7))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 8))
	patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
			"onEntityIconsModelRenderDetection", "(Lnet/minecraft/client/renderer/entity/model/EntityModel;FFFF)V"))
	instructions.insert(instructions.get(0), patchList)
	return methodNode
}

function modelRendererDoRenderTransform(methodNode){
	var instructions = methodNode.instructions
	var patchList = new InsnList()
	patchList.add(new VarInsnNode(Opcodes.ALOAD, 0))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 5))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 6))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 7))
	patchList.add(new VarInsnNode(Opcodes.FLOAD, 8))
	patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
			"onEntityIconsModelPartRenderDetection", "(Lnet/minecraft/client/renderer/model/ModelRenderer;FFFF)V"))
	instructions.insert(instructions.get(0), patchList)
	return methodNode
}

function initializeCoreMod() {
	return {
		'xaero_chunkclass': {
			'target' : {
				'type' : 'CLASS',
				'name' : 'net.minecraft.world.chunk.Chunk'
			},
			'transformer' : function(classNode){
				var fields = classNode.fields
				fields.add(new FieldNode(Opcodes.ACC_PUBLIC, "xaero_chunkClean", "Z", null, 0))
				return classNode
			}
		},
		'xaero_clientplaynethandler_handleblockchange': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_147234_a',
                'methodDesc' : '(Lnet/minecraft/network/play/server/SChangeBlockPacket;)V'
			},
			'transformer' : function(methodNode){
				clientPacketRedirectTransform(methodNode, new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onBlockChange", "(Lnet/minecraft/network/play/server/SChangeBlockPacket;)V"))
				return methodNode
			}
		},
		'xaero_clientplaynethandler_handlemultiblockchange': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_147287_a',
                'methodDesc' : '(Lnet/minecraft/network/play/server/SMultiBlockChangePacket;)V'
			},
			'transformer' : function(methodNode){
				clientPacketRedirectTransform(methodNode, new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onMultiBlockChange", "(Lnet/minecraft/network/play/server/SMultiBlockChangePacket;)V"))
				return methodNode
			}
		},
		'xaero_clientplaynethandler_handlechunkdata': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_147263_a',
                'methodDesc' : '(Lnet/minecraft/network/play/server/SChunkDataPacket;)V'
			},
			'transformer' : function(methodNode){
				clientPacketRedirectTransform(methodNode, new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onChunkData", "(Lnet/minecraft/network/play/server/SChunkDataPacket;)V"))
				return methodNode
			}
		},
		'xaero_clientplaynethandler_handlespawnpoint': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_230488_a_',
                'methodDesc' : '(Lnet/minecraft/network/play/server/SWorldSpawnChangedPacket;)V'
			},
			'transformer' : function(methodNode){
				clientPacketRedirectTransform(methodNode, new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onSpawn", "(Lnet/minecraft/network/play/server/SWorldSpawnChangedPacket;)V"))
				return methodNode
			}
		},
		'xaero_abstractclientplayerentity_getlocationcape': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.entity.player.AbstractClientPlayerEntity',
                'methodName': 'func_110303_q',
                'methodDesc' : '()Lnet/minecraft/util/ResourceLocation;'
			},
			'transformer' : function(methodNode){
				var MY_LABEL = new LabelNode(new Label())
				methodNode.maxStack += 1
				var insnToInsert = new InsnList()
				insnToInsert.add(new VarInsnNode(Opcodes.ALOAD, 0))
				insnToInsert.add(new MethodInsnNode(Opcodes.INVOKESTATIC, "xaero/common/core/XaeroMinimapCore", "getPlayerCape", "(Lnet/minecraft/client/entity/player/AbstractClientPlayerEntity;)Lnet/minecraft/util/ResourceLocation;"))
				insnToInsert.add(new InsnNode(Opcodes.DUP))
				insnToInsert.add(new JumpInsnNode(Opcodes.IFNULL, MY_LABEL))
				insnToInsert.add(new InsnNode(Opcodes.ARETURN))
				insnToInsert.add(MY_LABEL)
				insnToInsert.add(new InsnNode(Opcodes.POP))
				methodNode.instructions.insert(methodNode.instructions.get(0), insnToInsert)
				return methodNode
			}
		},
		'xaero_playerentity_iswearing': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.entity.player.PlayerEntity',
                'methodName': 'func_175148_a',
                'methodDesc' : '(Lnet/minecraft/entity/player/PlayerModelPart;)Z'
			},
			'transformer' : function(methodNode){
				var MY_LABEL = new LabelNode(new Label())
				var insnToInsert = new InsnList()
				insnToInsert.add(new VarInsnNode(Opcodes.ALOAD, 0))
				insnToInsert.add(new VarInsnNode(Opcodes.ALOAD, 1))
				insnToInsert.add(new MethodInsnNode(Opcodes.INVOKESTATIC, "xaero/common/core/XaeroMinimapCore", "isWearing", "(Lnet/minecraft/entity/player/PlayerEntity;Lnet/minecraft/entity/player/PlayerModelPart;)Ljava/lang/Boolean;"))
				insnToInsert.add(new InsnNode(Opcodes.DUP))
				insnToInsert.add(new JumpInsnNode(Opcodes.IFNULL, MY_LABEL))
				insnToInsert.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL, "java/lang/Boolean", "booleanValue", "()Z"))
				insnToInsert.add(new InsnNode(Opcodes.IRETURN))
				insnToInsert.add(MY_LABEL)
				insnToInsert.add(new InsnNode(Opcodes.POP))
				methodNode.instructions.insert(methodNode.instructions.get(0), insnToInsert)
				return methodNode
			}
		},
		'xaero_clientplaynethandlerclass': {
			'target' : {
				'type' : 'CLASS',
				'name' : 'net.minecraft.client.network.play.ClientPlayNetHandler'
			},
			'transformer' : function(classNode){
				var fields = classNode.fields
				classNode.interfaces.add("xaero/common/core/IXaeroMinimapClientPlayNetHandler")
				fields.add(new FieldNode(Opcodes.ACC_PRIVATE, "xaero_minimapSession", "Lxaero/common/XaeroMinimapSession;", null, null))
				addGetter(classNode, "xaero_minimapSession", "Lxaero/common/XaeroMinimapSession;")
				addSetter(classNode, "xaero_minimapSession", "Lxaero/common/XaeroMinimapSession;")
				
				return classNode
			}
		},
		'xaero_clientplaynethandler_handlejoingame': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_147282_a',
                'methodDesc' : '(Lnet/minecraft/network/play/server/SJoinGamePacket;)V'
			},
			'transformer' : function(methodNode){
				clientPacketRedirectTransformCustom(methodNode, new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onPlayNetHandler", "(Lnet/minecraft/client/network/play/ClientPlayNetHandler;)V"), 0)
				return methodNode
			}
		},
		'xaero_clientplaynethandler_cleanup': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.network.play.ClientPlayNetHandler',
                'methodName': 'func_147296_c',
                'methodDesc' : '()V'
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.ALOAD, 0))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onPlayNetHandlerCleanup", "(Lnet/minecraft/client/network/play/ClientPlayNetHandler;)V"))
				instructions.insert(instructions.get(0), patchList)
				return methodNode
			}
		},
		'xaero_clientworldclass': {
			'target' : {
				'type' : 'CLASS',
				'name' : 'net.minecraft.client.world.ClientWorld'
			},
			'transformer' : function(classNode){
				var fields = classNode.fields
				classNode.interfaces.add("xaero/common/minimap/mcworld/IXaeroMinimapClientWorld")
				fields.add(new FieldNode(Opcodes.ACC_PRIVATE, "xaero_minimapData", "Lxaero/common/minimap/mcworld/MinimapClientWorldData;", null, null))
				addGetter(classNode, "xaero_minimapData", "Lxaero/common/minimap/mcworld/MinimapClientWorldData;")
				addSetter(classNode, "xaero_minimapData", "Lxaero/common/minimap/mcworld/MinimapClientWorldData;")
				
				return classNode
			}
		},
		'xaero_clientplayerentity_respawnplayer': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.entity.player.ClientPlayerEntity',
                'methodName': 'func_71004_bE',
                'methodDesc' : '()V'
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.ALOAD, 0))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"beforeRespawn", "(Lnet/minecraft/entity/player/PlayerEntity;)V"))
				instructions.insert(instructions.get(0), patchList)
				return methodNode
			}
		},
		'xaero_smultiblockchangepacketclass': {//1.16.2 and newer
			'target' : {
				'type' : 'CLASS',
				'name' : 'net.minecraft.network.play.server.SMultiBlockChangePacket'
			},
			'transformer' : function(classNode){
				
				classNode.interfaces.add("xaero/common/core/IXaeroMinimapSMultiBlockChangePacket")
				var obfName = "field_244305_a";
				var normalName = "sectionPos";
				for(var i = 0; i < classNode.fields.size(); i++){
					var f = classNode.fields.get(i)
					if(f.name.equals(obfName) || f.name.equals(normalName)){
						addCustomGetter(classNode, f.name, "Lnet/minecraft/util/math/SectionPos;", "xaero_mm_getSectionPos")
						break
					}
				}
				
				return classNode
			}
		},
		'xaero_playerlist_sendworldinfo': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.server.management.PlayerList',
                'methodName': 'func_72354_b',
                'methodDesc' : '(Lnet/minecraft/entity/player/ServerPlayerEntity;Lnet/minecraft/world/server/ServerWorld;)V'
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.ALOAD, 1))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/server/core/XaeroMinimapServerCore', 
						"onServerWorldInfo", "(Lnet/minecraft/entity/player/PlayerEntity;)V"))
				instructions.insert(instructions.get(0), patchList)
				return methodNode
			}
		},
		'xaero_forgeingamegui_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraftforge.client.gui.ForgeIngameGui',
                'methodName': 'func_238445_a_',
                'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;F)V'
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.FLOAD, 2))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"beforeIngameGuiRender", "(F)V"))
				instructions.insert(instructions.get(0), patchList)
				return methodNode
			}
		},
		'xaero_bossoverlaygui_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.gui.overlay.BossOverlayGui',
                'methodName': 'func_238484_a_',
                'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;)V'
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var foundFirst = false
				var hasNextInsn
				for(var i = 0; i < instructions.size(); i++) {
					var insn = instructions.get(i)
					if(foundFirst){
						if(insn.getOpcode() == Opcodes.INVOKEINTERFACE && "java/util/Iterator".equals(insn.owner) && "hasNext".equals(insn.name))
							hasNextInsn = insn
						break;
					} else if(insn.getOpcode() == Opcodes.ALOAD && insn.var == 4)
						foundFirst = true
				}
				if(hasNextInsn == undefined)
					return methodNode
				
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.ILOAD, 3))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onBossHealthRender", "(I)V"))
				instructions.insertBefore(hasNextInsn, patchList)
				return methodNode
			}
		},
		'xaero_segmentedmodel_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.entity.model.SegmentedModel',
                'methodName': 'func_225598_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRenderDetectionTransform(methodNode)
			}
		},
		'xaero_ageablemodel_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.entity.model.AgeableModel',
                'methodName': 'func_225598_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRenderDetectionTransform(methodNode)
			}
		},
		'xaero_llamamodel_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.entity.model.LlamaModel',
                'methodName': 'func_225598_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRenderDetectionTransform(methodNode)
			}
		},
		'xaero_rabbitmodel_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.entity.model.RabbitModel',
                'methodName': 'func_225598_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRenderDetectionTransform(methodNode)
			}
		},
		'xaero_enderdragonmodel_render': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.entity.EnderDragonRenderer$EnderDragonModel',
                'methodName': 'func_225598_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRenderDetectionTransform(methodNode)
			}
		},
		'xaero_modelrenderer_dorender': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.client.renderer.model.ModelRenderer',
                'methodName': 'func_228306_a_',
				'methodDesc' : '(Lcom/mojang/blaze3d/matrix/MatrixStack$Entry;Lcom/mojang/blaze3d/vertex/IVertexBuilder;IIFFFF)V',
			},
			'transformer' : function(methodNode){
				return modelRendererDoRenderTransform(methodNode)
			}
		},
		'xaero_levelstorageaccess_deletelevel': {
			'target' : {
                'type': 'METHOD',
                'class': 'net.minecraft.world.storage.SaveFormat$LevelSave',
                'methodName': 'func_237299_g_',
				'methodDesc' : '()V',
			},
			'transformer' : function(methodNode){
				var instructions = methodNode.instructions
				var patchList = new InsnList()
				patchList.add(new VarInsnNode(Opcodes.ALOAD, 0))
				patchList.add(new MethodInsnNode(Opcodes.INVOKESTATIC, 'xaero/common/core/XaeroMinimapCore', 
						"onDeleteWorld", "(Lnet/minecraft/world/storage/SaveFormat$LevelSave;)V"))
				for(var i = instructions.size() - 1; i >= 0; i--){
					if(instructions.get(i).getOpcode() == Opcodes.RETURN){
						instructions.insertBefore(instructions.get(i), patchList)
						break
					}
				}
				return methodNode
			}
		}
	}
}