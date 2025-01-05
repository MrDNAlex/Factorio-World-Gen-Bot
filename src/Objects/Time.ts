class Time {
    public Time: number;

    constructor(time: number) {
        this.Time = time;
    }

    public GetTimeUnits ()
    {
        let days = Math.floor(this.Time / (1000 * 60 * 60 * 24));
        let hours = Math.floor((this.Time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((this.Time % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((this.Time % (1000 * 60)) / 1000);

        return{
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        };
    }

    public GetTimeAsString ()
    {
        const elapsed = new Date(this.Time);
        const days = elapsed.getUTCDate() - 1;
        const hours = elapsed.getUTCHours();
        const minutes = elapsed.getUTCMinutes();
        const seconds = elapsed.getUTCSeconds();

        if (days > 0)
            return `${days} d:${hours} h:${minutes} m:${seconds} s`;
        else if (hours > 0)
            return `${hours} h:${minutes} m:${seconds} s`;
        else if (minutes > 0)
            return `${minutes} m:${seconds} s`;
        else
            return `${seconds} s`;
    }
    
}

export default Time;