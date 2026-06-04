import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      let token = client.handshake.auth?.token || client.handshake.auth?.authorization || client.handshake.query?.token || client.handshake.headers.authorization;
      if (!token) {
        const data = context.switchToWs().getData() as any;
        token = data?.token || data?.auth?.token || data?.authorization;
      }
      if (typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      
      if (!token) throw new WsException('Unauthorized');
      
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
