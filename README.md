# ![Path-Planner](resources/path_planner.png?raw=true "Path Planner")

Path planner is a webapp aimed for visually compare different path planning algorithms for intelligent agents.

[Live Demo](https://aleeraser.github.io/Path-planner/)

## Description

**Path planning** is the process of determining the path an agent has to follow in order to reach a given destination. It's a problem with lot of variants, depending on the characteristics of the environment in which the entity has to move and also depending on the capabilities and knowledge of the entity itself.

The context that has been assumed during the making of the project is a bi-dimensional environment partitioned in a grid map. Each cell of the grid can be *free* or *occupied* by an obstacle object: among the free cells, two are marked as *start* and *destination*. The problem consists in finding the best possible path to reach the destination cell from the start position.

It is assumed that the dimension of the moving agent are always smaller that the one of the unit cell, therefore the path is defined as a sequence of free adjacent cells that leads the agent to the goal. Diagonal movements are allowed, provided that the agent does not pass between two diagonally adjacent obstacles. Also, the environment is assumed to be static, so there can't be any modification to the displacement of obstacles once the path computation starts.

In such environment, two different versions of the problem have been analyzed: the *global* or *offline* path planning in which there is a full a priori knowledge of the map configuration, and the *local* or *online* path planning where the only inputs are the starting position and the destination position and the agent discovers the presence of obstacles only when they are within a certain range, so to simulate proximity sensors.

For both kind of problems, the most popular techniques are implemented in order to study their behavior in different environment configurations and to compare their performances.

### Available algorithms

- Cellular Decomposition *
- Visibility Graph
- Probabilistic Roadmap
- Simple Potential Field
- Potential Field with Memory
- Bug v1
- Bug v2
- Tangent Bug

\* **Note**: the planner assumes the world as a discrete grid, thus some algorithms may behave or may be implemented a little differently compared to specification, **e.g.** **Cellular Decomposition**.

**For further informations please refer to the [project report](docs/report.pdf).**

## Authors

Alessandro Zini, Filippo Morselli, Carlo Stomeo
