/**
 * Oliver-OS Database Seed Script
 * Populates the database with sample data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const oliver = await prisma.user.upsert({
    where: { email: 'oliver@oliver-os.com' },
    update: {},
    create: {
      email: 'oliver@oliver-os.com',
      name: 'Oliver',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      }
    }
  });

  const girlfriend = await prisma.user.upsert({
    where: { email: 'girlfriend@oliver-os.com' },
    update: {},
    create: {
      email: 'girlfriend@oliver-os.com',
      name: 'Girlfriend',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Girlfriend',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
  });

  console.log('✅ Users created');

  // Create sample thoughts
  const thought1 = await prisma.thought.create({
    data: {
      userId: oliver.id,
      content: 'I need to build an AI-brain interface that can process thoughts in real-time and enable collaborative thinking.',
      type: 'text',
      metadata: {
        tags: ['ai', 'brain-interface', 'collaboration'],
        priority: 'high'
      }
    }
  });

  const thought2 = await prisma.thought.create({
    data: {
      userId: girlfriend.id,
      content: 'This Oliver-OS project is really interesting! I love the idea of real-time collaborative thinking.',
      type: 'text',
      metadata: {
        tags: ['collaboration', 'excitement', 'support'],
        priority: 'medium'
      }
    }
  });

  const thought3 = await prisma.thought.create({
    data: {
      userId: oliver.id,
      content: 'The WebSocket integration is working perfectly. Now I need to implement the Prisma schema for data persistence.',
      type: 'text',
      metadata: {
        tags: ['websocket', 'prisma', 'database'],
        priority: 'high'
      }
    }
  });

  console.log('✅ Thoughts created');

  // Create knowledge nodes
  const aiNode = await prisma.knowledgeNode.create({
    data: {
      label: 'Artificial Intelligence',
      type: 'concept',
      properties: {
        description: 'The simulation of human intelligence in machines',
        category: 'technology'
      }
    }
  });

  const brainNode = await prisma.knowledgeNode.create({
    data: {
      label: 'Brain Interface',
      type: 'concept',
      properties: {
        description: 'Direct communication pathway between the brain and external devices',
        category: 'technology'
      }
    }
  });

  const collaborationNode = await prisma.knowledgeNode.create({
    data: {
      label: 'Collaborative Thinking',
      type: 'concept',
      properties: {
        description: 'Multiple minds working together on shared thoughts and ideas',
        category: 'social'
      }
    }
  });

  console.log('✅ Knowledge nodes created');

  // Create knowledge relationships
  await prisma.knowledgeRelationship.create({
    data: {
      sourceId: aiNode.id,
      targetId: brainNode.id,
      relationshipType: 'enables',
      properties: {
        strength: 0.9,
        description: 'AI enables brain interface technology'
      },
      weight: 0.9
    }
  });

  await prisma.knowledgeRelationship.create({
    data: {
      sourceId: brainNode.id,
      targetId: collaborationNode.id,
      relationshipType: 'facilitates',
      properties: {
        strength: 0.8,
        description: 'Brain interfaces facilitate collaborative thinking'
      },
      weight: 0.8
    }
  });

  console.log('✅ Knowledge relationships created');

  // Create collaboration session
  const session = await prisma.collaborationSession.create({
    data: {
      name: 'AI Brain Interface Development',
      description: 'Collaborative development of Oliver-OS AI-brain interface',
      createdBy: oliver.id,
      participants: [oliver.id, girlfriend.id],
      settings: {
        allowVoiceChat: true,
        allowScreenShare: true,
        maxParticipants: 10
      }
    }
  });

  console.log('✅ Collaboration session created');

  // Create AI processing results
  await prisma.aiProcessingResult.create({
    data: {
      thoughtId: thought1.id,
      processingType: 'sentiment_analysis',
      modelName: 'gpt-4',
      inputData: { content: thought1.content },
      outputData: {
        sentiment: 'positive',
        confidence: 0.85,
        emotions: ['excitement', 'determination']
      },
      confidence: 0.85,
      processingTimeMs: 1200
    }
  });

  await prisma.aiProcessingResult.create({
    data: {
      thoughtId: thought2.id,
      processingType: 'sentiment_analysis',
      modelName: 'gpt-4',
      inputData: { content: thought2.content },
      outputData: {
        sentiment: 'very_positive',
        confidence: 0.92,
        emotions: ['excitement', 'support', 'enthusiasm']
      },
      confidence: 0.92,
      processingTimeMs: 1100
    }
  });

  console.log('✅ AI processing results created');

  // Create mind visualization
  await prisma.mindVisualization.create({
    data: {
      userId: oliver.id,
      name: 'Oliver-OS Architecture',
      visualizationType: 'network_graph',
      data: {
        nodes: [
          { id: 'frontend', label: 'React Frontend', type: 'component' },
          { id: 'backend', label: 'Node.js Backend', type: 'component' },
          { id: 'ai-services', label: 'AI Services', type: 'component' },
          { id: 'database', label: 'Multi-DB', type: 'component' }
        ],
        edges: [
          { source: 'frontend', target: 'backend', type: 'api' },
          { source: 'backend', target: 'ai-services', type: 'api' },
          { source: 'backend', target: 'database', type: 'query' }
        ]
      },
      settings: {
        layout: 'force-directed',
        showLabels: true,
        nodeSize: 'degree'
      },
      isShared: true
    }
  });

  console.log('✅ Mind visualization created');

  // Create real-time events
  await prisma.realtimeEvent.create({
    data: {
      sessionId: session.id,
      userId: oliver.id,
      eventType: 'user_joined',
      eventData: {
        user: {
          id: oliver.id,
          name: oliver.name,
          avatarUrl: oliver.avatarUrl
        },
        timestamp: new Date()
      }
    }
  });

  await prisma.realtimeEvent.create({
    data: {
      sessionId: session.id,
      userId: girlfriend.id,
      eventType: 'user_joined',
      eventData: {
        user: {
          id: girlfriend.id,
          name: girlfriend.name,
          avatarUrl: girlfriend.avatarUrl
        },
        timestamp: new Date()
      }
    }
  });

  console.log('✅ Real-time events created');

  console.log('\n🎉 Database seeded successfully!');
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.thought.count()} thoughts`);
  console.log(`Created ${await prisma.knowledgeNode.count()} knowledge nodes`);
  console.log(`Created ${await prisma.knowledgeRelationship.count()} relationships`);
  console.log(`Created ${await prisma.collaborationSession.count()} collaboration sessions`);
  console.log(`Created ${await prisma.aiProcessingResult.count()} AI processing results`);
  console.log(`Created ${await prisma.mindVisualization.count()} mind visualizations`);
  console.log(`Created ${await prisma.realtimeEvent.count()} real-time events`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
