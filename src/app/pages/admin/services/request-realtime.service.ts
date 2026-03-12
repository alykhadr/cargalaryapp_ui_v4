import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { GlobalComponent } from 'src/app/global-component';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class RequestRealtimeService {
  private connection: HubConnection | null = null;
  private readonly hubUrl = `${GlobalComponent.API_URL}/hubs/requests`;

  constructor(
    private authService: MyAuthService,
    private tokenStorageService: TokenStorageService
  ) {}

  async start(
    onRequestCreated: (payload: any) => void,
    onRequestStatusUpdated?: (payload: any) => void
  ): Promise<void> {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    this.connection = this.buildConnection(true);
    this.connection.off('requestCreated');
    this.connection.off('requestStatusUpdated');
    this.connection.on('requestCreated', onRequestCreated);
    if (onRequestStatusUpdated) {
      this.connection.on('requestStatusUpdated', onRequestStatusUpdated);
    }

    try {
      await this.connection.start();
    } catch {
      await this.connection.stop();
      this.connection = this.buildConnection(false);
      this.connection.off('requestCreated');
      this.connection.off('requestStatusUpdated');
      this.connection.on('requestCreated', onRequestCreated);
      if (onRequestStatusUpdated) {
        this.connection.on('requestStatusUpdated', onRequestStatusUpdated);
      }
      await this.connection.start();
    }
  }

  async stop(): Promise<void> {
    if (!this.connection) return;
    try {
      await this.connection.stop();
    } finally {
      this.connection = null;
    }
  }

  private buildConnection(withToken: boolean): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: false,
        accessTokenFactory: () => {
          if (!withToken) return '';
          return this.tokenStorageService.getToken() ?? this.authService.currentUserValue?.token ?? '';
        }
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Error)
      .build();
  }
}
