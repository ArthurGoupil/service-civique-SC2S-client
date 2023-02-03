import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import ExcelJS from 'exceljs'

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Irène'
  workbook.lastModifiedBy = 'Irène'
  workbook.created = new Date()
  workbook.modified = new Date()

  const sheet = workbook.addWorksheet('My Sheet')

  let numberOfSC2SMissions = 0

  sheet.columns = [
    { header: "Nom de l'annonce", key: 'name', width: 32 },
    { header: 'Organisme', key: 'organism', width: 32 },
    { header: 'Date', key: 'date', width: 32 },
    { header: 'Lieu de la mission (Ville)', key: 'place', width: 32 },
    { header: 'Lieu de la mission (Code postal)', key: 'place', width: 32 },
    { header: 'Contact', key: 'contact', width: 32 },
    { header: 'Téléphone', key: 'phone', width: 32 },
    { header: 'Email', key: 'email', width: 32 },
    { header: "Lien vers l'annonce", key: 'link', width: 32 },
    { header: 'Publics bénéficiaires', key: 'public', width: 32 },
  ]

  try {
    const response = await axios.get(
      `https://www.service-civique.gouv.fr/api/api/rest/missions?statusList%5B%5D=published&publicBeneficiaries=${req.query.publicBeneficiaries}&orderByField=publishDate&orderByDirection=DESC&first=${req.query.first}`
    )

    for (let i = 0; i < response.data.edges.length; i++) {
      const row = sheet.getRow(i + 2 - numberOfSC2SMissions)

      const edge = response.data.edges[i]

      if (
        (!edge.node.title.toLowerCase().includes('sc2s') ||
          req.query.excludeSC2S === 'false') &&
        edge.node.status === 'published'
      ) {
        row.getCell(1).value = edge.node.title
        row.getCell(2).value = edge.node.organization.name
        row.getCell(3).value = edge.node.startDate
        row.getCell(4).value = edge.node.interventionPlace.city
        row.getCell(5).value = edge.node.interventionPlace.zip

        const missionResponse = await axios.get(
          `https://www.service-civique.gouv.fr/api/api/rest/missions/${edge.node.id}`
        )

        row.getCell(6).value =
          missionResponse.data.contact?.firstName +
          ' ' +
          missionResponse.data.contact?.lastName +
          ' ' +
          (missionResponse.data.contact?.function
            ? `(fonction: ${missionResponse.data.contact?.function})`
            : '')
        row.getCell(7).value = missionResponse.data.contact?.telephone
        row.getCell(8).value = missionResponse.data.contact?.email
        row.getCell(
          9
        ).value = `https://www.service-civique.gouv.fr/trouver-ma-mission/${edge.node.slug}-${edge.node.id}`

        row.getCell(10).value =
          missionResponse.data.publicBeneficiaries.join(',')
      } else {
        numberOfSC2SMissions++
      }

      console.log(`Mission ${edge.node.id} added`)
    }

    const buffer = await workbook.xlsx.writeBuffer()
    res.write(buffer)
    res.end()
  } catch (error) {
    console.error('error', error)
  }
}
