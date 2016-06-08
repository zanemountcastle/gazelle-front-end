import BaseComponent from "../BaseComponent"
import model from "./model"
import _ from "lodash"

// Abstract class for fetching falcor objects
export default class FalcorController extends BaseComponent {
  constructor(props) {
    super(props)
    if (this.constructor == FalcorController) {
      throw new TypeError("FalcorController is abstract")
    }
    this.safeSetState({
      fetching: false,
      data: null
    })
  }

  // Return falcor paths as specified by:
  // http://netflix.github.io/falcor/documentation/paths.html
  // FalcorPath can depend on props only (to get server side rendering working)
  static getFalcorPath(params) {
    throw new TypeError(
      "You must implement the getFalcorPath method " +
      "in children of FalcorController"
    )
  }

  // Returns a promise of the falcor data
  // This should only be called on client side, as server side does a
  // mass fetch on results from getFalcorPath
  // It actually returns nothing, but it lets the outside function
  // know that the falcor fetch finished
  falcorFetch() {
    console.log("FALCOR FETCH for")
    console.log(this.constructor)
    const falcorPath = this.constructor.getFalcorPath(this.props.params)
    if (this.props.isServer) {
      // scary undocumented API. Liable to break at any point
      // be warned!
      console.log("SERVER FETCH")
      console.log(falcorPath)
      console.log(this.props.model)
      const data = this.props.model._getValueSync(this.props.model, falcorPath, true)
      this.safeSetState({
        fetching: false,
        data: data.value
      })
      console.log("DONE")
    } else {
      this.safeSetState({fetching: true})
      this.props.model.get(falcorPath).then((x) => {
        console.log(x)
        if (x) {
          console.log("SETTING")
          this.safeSetState({
            fetching: false,
            data: x.json
          })
          console.log("SET SUCCESS")
          console.log(this.state.data)
        } else {
          throw new Error("FalcorPath: " + falcorPath + " returned no data")
        }
      }).catch((e) => {
        console.error("Failed to fetch for falcorPath: " + falcorPath)
        console.error(e.stack)
      })
    }
  }

  // If the new props requires a new falcor call
  // this will pick it up and make the new fetch request
  shouldComponentUpdate(nextProps, nextState) {
    const shouldUpdate = super.shouldComponentUpdate(nextProps, nextState)
    if (shouldUpdate) {
      const newPath = this.constructor.getFalcorPath(nextProps.params)
      const oldPath = this.constructor.getFalcorPath(this.props.params)
      if (!_.isEqual(oldPath, newPath)) {
        this.falcorFetch(newPath)
      }
    }
    return shouldUpdate
  }

  componentWillMount() {
    console.log("WILL MOUNT")
    this.falcorFetch()
  }

  // Following are for example purposes. You must always call
  // the super for componentDidMount and componentWillUnmount
  componentDidMount() {
    super.componentDidMount()
  }

  componentWillUnmount() {
    super.componentWillUnmount()
  }
}
