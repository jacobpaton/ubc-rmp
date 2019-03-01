import CourseScraper from './courseScraper.js'
import SectionScraper from './sectionScraper.js'
import PageType from './pageType.js'
import DocElement from './docElement.js'

class TooltipBuilder {

  constructor(courseJSON, ratingJSON) {
    // Ex:
    // {
    //   "AANB": {
    //     "500": {},
    //     "504": {
    //         "002": 1310500
    //     }
    // }
    this.courseToInstr = courseJSON

    // Ex:
    // "1009612": {
    //   "difficulty":       2.3,
    //   "name":             "FRANCOIS, ROGER",
    //   "overall":          3.5,
    //   "rmpid":            797936,
    //   "ubcid":            1009612,
    //   "would_take_again":  "75%"
    // }
    this.instrToRating = ratingJSON
  }

  getInstrID(section) {
    let urlParams = new URLSearchParams(window.location.href)
    let dept = urlParams.get('dept')
    let course = urlParams.get('course')
    return this.courseToInstr[dept][course][section]
  }

  getRating(section) {
    let instrID = this.getInstrID(section)
    return this.instrToRating[instrID]
  }

  getRMPProfileLink(profID) {
    let baseURL = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid="
    return baseURL + profID
  }

  getProfStat(section) {
    let rating = this.getRating(section)

    let would_take_again_str
    // Switch used here to handle either when str is empty or "N/A"
    switch (rating.would_take_again) {
      case "":
        would_take_again_str = "Unknown"
        break
      case "N/A":
        would_take_again_str = "N/A"
        break
      default:
        would_take_again_str = rating.would_take_again
    }

    let result = {
      name:              rating.name,
      over_all:          rating.overall,
      would_take_again:  would_take_again_str,
      difficulty:        rating.difficulty,
      rmpid:             rating.rmpid,
      url:               this.getRMPProfileLink(rating.rmpid)
    }

    return result
  }

  // Tippy.js need to receive the element that exist in DOM
  appendElmToTable(elm) {
    // let table = document.getElementsByClassName('section-summary')[0]
    document.body.appendChild(elm)
  }

  // Wrapper div that is 'display: none' is required here since
  // Tippy.js need to receive the element that exist in DOM
  // Without wrapper, it would break the page layout
  appendTrueTemplate(templateId, profRating) {
    let wrapper = DocElement.getWrapperDiv()
    let div = document.createElement("div");
    div.setAttribute("id", templateId);
    div.appendChild(DocElement.getLinkElem(profRating.name, profRating.url))
    div.appendChild(DocElement.getStatsPElem("Overall:", profRating.over_all))
    div.appendChild(DocElement.getStatsPElem("Difficulty:", profRating.difficulty))
    div.appendChild(DocElement.getStatsPElem("Would Take Again:", profRating.would_take_again))
    wrapper.appendChild(div)
    this.appendElmToTable(wrapper)
  }

  appendNoReviewTemplate(templateId, profRating) {
    let wrapper = DocElement.getWrapperDiv()
    let div = document.createElement("div");
    div.setAttribute("id", templateId);
    let errorMsg = DocElement.getPElem("This prof doesn't have any review :(")
    let callToAction = DocElement.getLinkElem("Add a review", profRating.url)
    div.appendChild(errorMsg)
    div.appendChild(callToAction)
    wrapper.appendChild(div)
    this.appendElmToTable(wrapper)
  }

  appendNoProfileTemplate(templateId) {
    let wrapper = DocElement.getWrapperDiv()
    let div = document.createElement("div");
    div.setAttribute("id", templateId);
    let errorMsg = DocElement.getPElem("This prof doesn't have a profile :(")
    let newProfileLink = "https://www.ratemyprofessors.com/teacher/create"
    let callToAction = DocElement.getLinkElem("Add a new prof profile", newProfileLink)
    div.appendChild(errorMsg)
    div.appendChild(callToAction)
    wrapper.appendChild(div)
    this.appendElmToTable(wrapper)
  }

  // Add tooltip template to all elements with .ubc-rmp-link class
  tippyAppendTemplate() {
    tippy('.ubc-rmp-link', {
      content: function (reference) {
        return document.getElementById(reference.getAttribute('data-template'))
      },
      // Keep tooltip if hovered
      interactive: true,
      placement: "right",
      arrow: true,
      arrowType: "round",
      theme: "dark-blue",
    })
  }

  haveRating(profRating) {
    return profRating.difficulty != 0
  }

  haveRMPProfile(profRating) {
    console.log(profRating)
    return profRating.rmpid != 0
  }

  addTooltip(element, templateID, profRating) {
      if (this.haveRating(profRating)) {
        element.classList.add('ubc-rmp-link', 'ubc-rmp-true')
        element.setAttribute("data-template", templateID)
        this.appendTrueTemplate(templateID, profRating)
      } else {
        element.classList.add('ubc-rmp-link', 'ubc-rmp-false')
        element.setAttribute("data-template", templateID)
        if (this.haveRMPProfile(profRating)) {
          this.appendNoReviewTemplate(templateID, profRating)
        } else {
          this.appendNoProfileTemplate(templateID)
        }
      }
  }

  setCourseTooltips() {
    let lectureRows = CourseScraper.getLectureRows()

    Object.keys(lectureRows).map(rowNum => {
      let sectionLinkElement = CourseScraper.rows[rowNum].cells[1].children[0]
      let templateID = `ubc-rmp-template-${rowNum}`
      let profRating = this.getProfStat(lectureRows[rowNum])

      this.addTooltip(sectionLinkElement, templateID, profRating)
    })

    this.tippyAppendTemplate()
  }

  setSectionTooltips() {
    let instrLinkElement = SectionScraper.getInstrLinkElement()
    let templateID = `ubc-rmp-template-1`
    let section = SectionScraper.section
    let profRating = this.getProfStat(section)

    this.addTooltip(instrLinkElement, templateID, profRating)
    this.tippyAppendTemplate()
  }
}

export default TooltipBuilder
