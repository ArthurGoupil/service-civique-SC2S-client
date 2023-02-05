import axios, { AxiosError } from 'axios'
import fileDownload from 'js-file-download'
import { useEffect, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import { v4 as uuidv4 } from 'uuid'

const uuid = uuidv4()

export default function Home() {
  const [targetPublic, setTargetPublic] = useState<string[]>([])
  const [first, setFirst] = useState<string>('10')
  const [excludeSC2S, setExcludeSC2S] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const { lastMessage, readyState, getWebSocket } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL ?? '',
    {
      queryParams: { wsClientId: uuid },
    }
  )

  const downloadFile = async () => {
    try {
      setError(undefined)
      setIsLoading(true)

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/missions`,
        {
          params: {
            publicBeneficiaries: targetPublic.join('%2C'),
            first,
            excludeSC2S,
            wsClientId: uuid,
          },
          responseType: 'arraybuffer',
        }
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      fileDownload(
        blob,
        `missions-service-civique_export-${new Date().toLocaleDateString(
          'fr'
        )}.xlsx`
      )
    } catch (error) {
      setError((error as AxiosError).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (publicString: string) => {
    if (targetPublic.includes(publicString)) {
      const index = targetPublic.indexOf(publicString)
      targetPublic.splice(index, index + 1)

      setTargetPublic([...targetPublic])
    } else {
      setTargetPublic([...targetPublic, publicString])
    }
  }

  useEffect(() => {
    const socket = getWebSocket()

    return () => socket?.close()
  }, [getWebSocket])

  return (
    <>
      <div className="element">
        <b>
          Chercher des missions qui visent au moins l&apos;un des
          bénéficiaire(s) suivant(s) :
        </b>
      </div>
      <div className="element">
        <input
          id="seniors"
          type="checkbox"
          value="seniors"
          name="seniors"
          onChange={() => handleChange('seniors')}
        />
        <label htmlFor="seniors">Seniors</label>
      </div>
      <div className="element">
        <input
          id="adultes"
          type="checkbox"
          value="adultes"
          name="adultes"
          onChange={() => handleChange('adultes')}
        />
        <label htmlFor="adultes">Adultes</label>
      </div>
      <div className="element">
        <input
          id="handicap"
          type="checkbox"
          value="handicap"
          name="handicap"
          onChange={() => handleChange('handicap')}
        />
        <label htmlFor="handicap">Handicap</label>
      </div>
      <div className="element">
        <input
          id="young"
          type="checkbox"
          value="young"
          name="young"
          onChange={() => handleChange('young')}
        />
        <label htmlFor="young">Jeunes</label>
      </div>
      <div className="element">
        <input
          id="marginalisees_fragilisees"
          type="checkbox"
          value="marginalisees_fragilisees"
          name="marginalisees_fragilisees"
          onChange={() => handleChange('marginalisees_fragilisees')}
        />
        <label htmlFor="marginalisees_fragilisees">
          Marginalisés/Fragilisés
        </label>
      </div>
      <div className="element">
        <input
          id="faune_flaure"
          type="checkbox"
          value="faune_flaure"
          name="faune_flaure"
          onChange={() => handleChange('faune_flaure')}
        />
        <label htmlFor="faune_flaure">Faune/Flaure</label>
      </div>
      <div className="element">
        <input
          id="tous_publics"
          type="checkbox"
          value="tous_publics"
          name="tous_publics"
          onChange={() => handleChange('tous_publics')}
        />
        <label htmlFor="tous_publics">Tous publics</label>
      </div>

      <div className="element">
        <label htmlFor="first" className="margin-right">
          <b>Chercher parmi les X missions les plus récentes</b>
        </label>
        <input
          id="first"
          type="text"
          name="first"
          value={first}
          onChange={(e) => {
            setFirst(e.target.value)
          }}
        />
      </div>

      <div className="element">
        <input
          id="exclude"
          type="checkbox"
          value="exclude"
          name="exclude"
          onChange={(e) => setExcludeSC2S(e.target.checked)}
        />
        <label htmlFor="exclude">Exclure les missions SC2S</label>
      </div>

      <button
        className="element"
        onClick={() => downloadFile()}
        disabled={readyState !== ReadyState.OPEN}
      >
        Télécharger Excel
      </button>

      {error && <div className="element">ERROR: {error}</div>}
      {isLoading && (
        <div className="element">
          Chargement en cours ... (cela peut prendre plusieurs minutes !)
        </div>
      )}
      {lastMessage && isLoading && <div>{lastMessage.data}</div>}
    </>
  )
}
