find out what's driving high reads and writes

expected number of writes for each update
- variables
    - # days = 14
    - # sports = 2
    - # games / day = 52
        - nba ~ 7
        - ncaambb ~ 45
    - # updates / day = 24

- document writes per update
    - # sports + (# days * # games / day)
    - 2 + 14 * 52
    - 730

- document writes per day
    - 730 * 24
    - 17520