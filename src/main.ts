import { AlchemyProvider, parseEther, Wallet } from 'ethers';
import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
dotenv.config()

const provider = new AlchemyProvider(+process.env.CHAIN_ID!, process.env.ALCHEMY_KEY!);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const server = Fastify({ logger: true })

server.register(cors, { origin: true, methods: ['POST'] })
  
server.addContentTypeParser('application/grpc-web+proto', function (req, payload, done) {
    let data = ''
    payload.on('data', chunk => data += chunk)
    payload.on('end', () => done(null, data))
})

server.post('/faucet.FaucetService/DripDev', async function (request, reply) {
    try {
        const addresses = (request.body as string).match(/0x[0-9a-fA-F]+/g) ?? [];
        for(let i = 0; i < addresses.length; i++) {
            const tx = await wallet.sendTransaction({
                to: addresses[i],
                value: parseEther(process.env.AMOUNT!),
            })
            await tx.wait();
        }
        reply.status(200).send({ success: true })
    } catch(e) {
        console.error("ERROR", e);
        reply.status(500).send({ success: false })
    }
})

server.listen({ port: 3000 })