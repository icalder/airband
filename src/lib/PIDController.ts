export class PIDController {
  private errorPrior = 0
  private integralPrior = 0

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private iterationTime: number = 1,
    private kp: number = 0,
    private ki: number = 0,
    private kd: number = 0
  ) {}

  public reset() {
    this.errorPrior = 0
    this.integralPrior = 0
  }

  public run(desiredValue: number, actualValue: number): number {
    const error = desiredValue - actualValue
    const integral = this.integralPrior + error * this.iterationTime
    const derivative = (error - this.errorPrior) / this.iterationTime
    const output = this.kp * error + this.ki * integral + this.kd * derivative
    this.errorPrior = error
    this.integralPrior = integral
    /* if (Math.random() > 0.96) {
      console.log(`${desiredValue} ${actualValue} ${error} ${output}`)
    } */
    return output
  }
}
