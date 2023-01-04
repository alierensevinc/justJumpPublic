/* tslint:disable:radix */
import {Component} from '@angular/core';
import {LoadingController} from '@ionic/angular';
import {Plugins} from '@capacitor/core';

const {Storage} = Plugins;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    // Game State
    gameRunning = false;
    hasContact = false;
    hasFailedOnce = false;

    // Jump State
    onJump = false;

    // Score State
    score = 0;
    highScore;

    // Intervals
    gameInterval;
    contactInterval;
    scoreInterval;

    // Texts
    titleText = 'Welcome !';
    gameButtonText = 'Start Playing';

    // Obstacle State
    showObstacle = false;
    showAirObstacle = true;

    constructor(private loadingController: LoadingController) {
        // noinspection JSIgnoredPromiseFromCall
        this.getHighScore();
    }

    ionViewDidEnter() {
        Plugins.App.addListener('backButton', Plugins.App.exitApp);
    }

    startGame() {
        this.hasContact = false;
        this.gameRunning = true;
        this.hasFailedOnce = true; // To display score when game has started
        this.onJump = false;
        this.score = 0;
        this.resetTimer();
        this.randomObstacle();
        this.startTimer();
    }

    endGame() {
        this.hasContact = true;
        this.gameRunning = false;
        this.hasFailedOnce = true;
        this.titleText = 'Game Over !';
        this.gameButtonText = 'Try Again';
        if (this.score > this.highScore) {
            // noinspection JSIgnoredPromiseFromCall
            this.setHighScore(this.score.toString());
        }
    }

    startTimer() {
        this.gameInterval = setInterval(() => {
            if (this.gameRunning) {
                const player = document.getElementById('player');
                const playerTop = parseInt(window.getComputedStyle(player).getPropertyValue('top'));
                if (this.showObstacle) {
                    const obstacle = document.getElementById('obstacle');
                    const obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue('left'));
                    if (obstacleLeft < 80 && obstacleLeft > 20 && playerTop >= 100) {
                        this.endGame();
                    }
                } else if (this.showAirObstacle) {
                    const airObstacle = document.getElementById('airObstacle');
                    const airObstacleLeft = parseInt(window.getComputedStyle(airObstacle).getPropertyValue('left'));
                    if (airObstacleLeft < 80 && airObstacleLeft > 20 && playerTop <= 120) {
                        this.endGame();
                    }
                }
            }
        }, 10);

        this.contactInterval = setInterval(() => {
            if (this.hasContact && this.gameRunning) {
                this.gameRunning = false;
            }
        }, 800);

        this.scoreInterval = setInterval(() => {
            if (!this.hasContact && this.gameRunning) {
                this.score++;
                this.randomObstacle();
            }
        }, 1600);
    }

    resetTimer() {
        clearInterval(this.gameInterval);
        clearInterval(this.contactInterval);
        clearInterval(this.scoreInterval);
    }

    jump() {
        if (!this.onJump && this.gameRunning) {
            this.onJump = true;
            setTimeout(() => {
                this.onJump = false;
            }, 600);
        }
    }

    randomObstacle() {
        if (Math.floor(Math.random() * 2) + 1 === 1) {
            this.showObstacle = true;
            this.showAirObstacle = false;
        } else {
            this.showObstacle = false;
            this.showAirObstacle = true;
        }
    }

    // High Score and Storage Functions
    async setHighScore(score) {
        const loading = await this.loadingController.create({
            message: 'Please wait...',
            mode: 'ios'
        });
        await loading.present();

        this.setItem('highScore', score).then(() => {
            this.highScore = score;
            loading.dismiss();
        }).catch((error) => {
            console.log(error);
            loading.dismiss();
        });
    }

    async getHighScore() {
        const loading = await this.loadingController.create({
            message: 'Please wait...',
            mode: 'ios',
        });
        await loading.present();

        this.getItem('highScore').then((value) => {
            if (value.value !== null) {
                this.highScore = parseInt(value.value);
            } else {
                this.highScore = 0;
            }
            loading.dismiss();
        }).catch(() => {
            this.highScore = 0;
            loading.dismiss();
        });
    }

    async setItem(pKey, pValue) {
        await Storage.set({
            key: pKey,
            value: pValue
        });
    }

    async getItem(pKey) {
        return await Storage.get({key: pKey});
    }
}
