import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactPolling from 'react-polling'

import client from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'
import styles from './WebhookItem.css'

const webhookItem = ({ name, url, id, toggleSnackbar }) => {
  const [isUpdating, setUpdating] = useState(true)
  const [isDeploying, setDeploying] = useState(false)
  const [status, setStatus] = useState(false)

  useEffect(() => {
    const latest = getLatestDeployment('C2D85dYI4skWHReE2cWNJaQC').then(
      (res) => {
        const deployment = res.data.deployments[0]
        setUpdating(false)
        setStatus(deployment.state)
        if (status !== 'READY') {
          setDeploying(true)
        }
      }
    )
  }, [])

  useEffect(() => {
    if (status === 'READY') {
      setDeploying(false)
    }
  }, [status])

  const getLatestDeployment = (vercelToken = 'C2D85dYI4skWHReE2cWNJaQC') => {
    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer C2D85dYI4skWHReE2cWNJaQC`,
      },
      url: 'https://api.vercel.com/v5/now/deployments?limit=1',
    }

    return axios(options)
  }

  const onDeploy = (name, url) => {
    setDeploying(true)
    toggleSnackbar(false)
    global
      .fetch(url, {
        method: 'POST',
      })
      .then((res) => {
        toggleSnackbar(true, 'success', 'Success!', `Deployed webhook: ${name}`)
      })
      .catch((err) => {
        setDeploying(false)
        toggleSnackbar(true, 'error', 'Deploy Failed', `${err}`)
        console.log(err)
      })
  }

  const onRemove = (name, id) => {
    setUpdating(true)
    client.delete(id).then((res) => {
      setUpdating(false)
      toggleSnackbar(
        true,
        'success',
        'Webhook Deleted',
        `Successfully deleted webhook: ${name}`
      )
      console.log(res)
    })
  }

  return (
    <>
      <div className={styles.hook}>
        <div className={styles.hookDetails}>
          <h4 className={styles.hookTitle}>{name}</h4>
          <p className={styles.hookURL}>{url}</p>
        </div>
        <div className={styles.hookActions}>
          <div className={styles.hookStatus}>
            {isDeploying ? (
              <ReactPolling
                url={'custom'}
                method={'GET'}
                interval={5000}
                retryCount={2}
                onSuccess={(res) => {
                  const deployment = res.data.deployments[0]
                  setStatus(deployment.state)
                  console.log(deployment)
                  return true
                }}
                onFailure={(err) => console.log(err)}
                promise={getLatestDeployment}
                render={({ startPolling, stopPolling, isPolling }) => {
                  if (isPolling) {
                    return (
                      <div>
                        {status ? (
                          <span
                            className={styles.hookStatusIndicator}
                            data-indicator={status}
                          >
                            {titleCase(status)}
                          </span>
                        ) : (
                          <span
                            className={styles.hookStatusIndicator}
                            data-indicator="LOADING"
                          >
                            Loading
                          </span>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div
                        className={styles.hookStatusIndicator}
                        data-indicator="INACTIVE"
                      >
                        Status Inactive
                      </div>
                    )
                  }
                }}
              />
            ) : (
              <>
                {status ? (
                  <span
                    className={styles.hookStatusIndicator}
                    data-indicator={status}
                  >
                    {titleCase(status)}
                  </span>
                ) : (
                  <span
                    className={styles.hookStatusIndicator}
                    data-indicator="LOADING"
                  >
                    Loading
                  </span>
                )}
              </>
            )}
          </div>
          <Button
            color="success"
            onClick={() => onDeploy(name, url)}
            className={styles.deployButton}
            disabled={isDeploying || isUpdating}
            loading={isDeploying}
            type="button"
          >
            Deploy
          </Button>{' '}
          <Button
            color="danger"
            inverted
            onClick={() => onRemove(name, id)}
            className={styles.deleteButton}
            disabled={isDeploying || isUpdating}
            loading={isUpdating}
            type="button"
          >
            Remove
          </Button>
        </div>
      </div>
    </>
  )
}

const titleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export default webhookItem