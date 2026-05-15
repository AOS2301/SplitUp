export class HealthCheckController {
  static async health(req, res) {
    return res.status(200).json({ status: "OK" });
  }
}